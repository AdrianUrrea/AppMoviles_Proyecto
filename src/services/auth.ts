import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';
import { AUTH_MESSAGES } from '@/validation/mensajes';
import type { AuthErrorCode } from '@/validation/mensajes';

export type { AuthErrorCode };

export class AuthServiceError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(AUTH_MESSAGES[code]);
    this.name = 'AuthServiceError';
  }
}

const TIEMPO_LIMITE_MS = 20_000;

/** Si la red se cuelga, falla con el mensaje de "sin conexion" en vez de dejar el boton cargando para siempre. */
const limite = <T,>(llamada: PromiseLike<T>): Promise<T> =>
  withTimeout(llamada, TIEMPO_LIMITE_MS, () => new AuthServiceError('NETWORK'));

/** Mensaje listo para mostrar al usuario a partir de cualquier error. */
export function getErrorMessage(error: unknown): string {
  return error instanceof AuthServiceError ? error.message : AUTH_MESSAGES.UNKNOWN;
}

type SupabaseLikeError = { message?: string; status?: number; code?: string };

/** Solo en desarrollo: imprime el error original en la terminal de Metro para poder diagnosticarlo. */
function logDev(contexto: string, error: unknown) {
  if (!__DEV__) return;
  const e = (error ?? {}) as { name?: string; message?: string; status?: number; code?: string };
  console.warn(`[auth:${contexto}]`, `name=${e.name}`, `status=${e.status}`, `code=${e.code}`, `message=${e.message}`);
}

function toServiceError(error: unknown, contexto: string): AuthServiceError {
  if (error instanceof AuthServiceError) return error;
  logDev(contexto, error);
  if (isAuthRetryableFetchError(error)) return new AuthServiceError('NETWORK');
  const e = (error ?? {}) as SupabaseLikeError;
  // Fallos de red que llegan como error generico (p. ej. desde supabase.rpc): "fetch failed", "Network request failed"...
  if (/fetch failed|network request failed|failed to fetch|timed? ?out/i.test(e.message ?? '')) {
    return new AuthServiceError('NETWORK');
  }
  if (e.status === 429 || e.code === 'over_request_rate_limit' || e.code === 'over_email_send_rate_limit') {
    return new AuthServiceError('RATE_LIMITED');
  }
  return new AuthServiceError('UNKNOWN');
}

export type RegisterInput = {
  correo: string;
  password: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  nacimiento: string; // YYYY-MM-DD
  rfc: string;
  calle: string;
  numExt: string;
  numInt?: string;
  colonia: string;
  cp: string;
  municipio: string;
  estado: string;
  aceptoPrivacidad: boolean;
};

/** Crea la cuenta (sin verificar) y envia el codigo al correo. */
export async function register(input: RegisterInput): Promise<{ correo: string }> {
  const correo = input.correo.trim().toLowerCase();
  const rfc = input.rfc.trim().toUpperCase();

  try {
    const { data: libre, error: rfcError } = await limite(supabase.rpc('rfc_disponible', { p_rfc: rfc }));
    if (rfcError) throw rfcError;
    if (libre === false) throw new AuthServiceError('RFC_TAKEN');

    const { data, error } = await limite(supabase.auth.signUp({
      email: correo,
      password: input.password,
      options: {
        data: {
          nombre: input.nombre,
          apellido_paterno: input.apellidoPaterno,
          apellido_materno: input.apellidoMaterno ?? '',
          nacimiento: input.nacimiento,
          rfc,
          calle: input.calle,
          num_ext: input.numExt,
          num_int: input.numInt ?? '',
          colonia: input.colonia,
          cp: input.cp,
          municipio: input.municipio,
          estado: input.estado,
          acepto_privacidad: input.aceptoPrivacidad,
        },
      },
    }));

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      if (msg.includes('already registered')) throw new AuthServiceError('EMAIL_TAKEN');
      // El trigger rechazo el perfil (RFC duplicado por carrera, edad, formato...).
      if (msg.includes('database error')) throw new AuthServiceError('PROFILE_REJECTED');
      throw error;
    }

    // Con confirmacion de correo activa, Supabase NO devuelve error si el correo ya
    // esta registrado y verificado: devuelve un usuario con identities vacio.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      throw new AuthServiceError('EMAIL_TAKEN');
    }

    return { correo };
  } catch (e) {
    throw toServiceError(e, 'register');
  }
}

/** Valida el codigo numerico del correo. Si es correcto, Supabase abre la sesion. */
export async function verifyCode(correo: string, code: string): Promise<void> {
  try {
    const { error } = await limite(supabase.auth.verifyOtp({
      email: correo.trim().toLowerCase(),
      token: code.trim(),
      type: 'signup',
    }));
    if (error) {
      if (error.status === 429) throw new AuthServiceError('RATE_LIMITED');
      if (error.status === 400 || error.status === 403 || error.status === 422) {
        throw new AuthServiceError('CODE_INVALID');
      }
      throw error;
    }
  } catch (e) {
    throw toServiceError(e, 'verifyCode');
  }
}

/** Reenvia el codigo. El limite de frecuencia lo aplica Supabase (ver configuracion). */
export async function resendCode(correo: string): Promise<void> {
  try {
    const { error } = await limite(
      supabase.auth.resend({
        type: 'signup',
        email: correo.trim().toLowerCase(),
      }),
    );
    if (error) throw error;
  } catch (e) {
    throw toServiceError(e, 'resendCode');
  }
}

/**
 * Inicia sesion. Si el correo no esta verificado, reenvia el codigo y lanza
 * EMAIL_NOT_VERIFIED para que la pantalla lleve al usuario a confirmar.
 */
export async function signIn(correo: string, password: string): Promise<void> {
  const email = correo.trim().toLowerCase();
  try {
    const { error } = await limite(supabase.auth.signInWithPassword({ email, password }));
    if (!error) return;

    if (error.code === 'email_not_confirmed') {
      await limite(supabase.auth.resend({ type: 'signup', email })).catch(() => {});
      throw new AuthServiceError('EMAIL_NOT_VERIFIED');
    }
    if (error.code === 'invalid_credentials') {
      throw new AuthServiceError('INVALID_CREDENTIALS');
    }
    throw error;
  } catch (e) {
    throw toServiceError(e, 'signIn');
  }
}

/**
 * Cambia la contraseña de la sesion abierta.
 *  1. Se confirma la contraseña ACTUAL (la sesion abierta no basta: alguien podria usar un telefono desbloqueado).
 *  2. Se guarda la nueva.
 *  3. Se cierran las sesiones de los demas dispositivos, que usaban la contraseña anterior. Si esto falla, la
 *     contraseña ya cambio y no se avisa de error.
 */
export async function changePassword(correo: string, actual: string, nueva: string): Promise<void> {
  const email = correo.trim().toLowerCase();
  try {
    const { error: errorActual } = await limite(supabase.auth.signInWithPassword({ email, password: actual }));
    if (errorActual) {
      if (errorActual.code === 'invalid_credentials') throw new AuthServiceError('CURRENT_PASSWORD_WRONG');
      throw errorActual;
    }

    const { error } = await limite(supabase.auth.updateUser({ password: nueva }));
    if (error) {
      if (error.code === 'same_password') throw new AuthServiceError('SAME_PASSWORD');
      if (error.code === 'weak_password') throw new AuthServiceError('WEAK_PASSWORD');
      throw error;
    }

    await limite(supabase.auth.signOut({ scope: 'others' })).catch(() => undefined);
  } catch (e) {
    throw toServiceError(e, 'changePassword');
  }
}
