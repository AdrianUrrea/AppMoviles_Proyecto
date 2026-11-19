/**
 * Logica pura del modo sin conexion de "Datos de dinero" (sin dependencias de la app: facil de probar).
 *
 * Por cada formulario (clave) el telefono guarda UN registro con tres cosas:
 *  - borrador:  lo que el usuario va escribiendo y aun no guarda. Se conserva tal cual (aunque falte algo o sea
 *               invalido) para que, si la app se cierra, el formulario reabra en el mismo punto. No se envia.
 *  - guardado:  lo ultimo que el usuario guardo con el boton "Guardar" (ya validado).
 *  - pendiente: true si "guardado" todavia no llego al servidor.
 */

import { normalizar } from './esquema';
import { CLAVE_VALIDA, camposDe, esTipoDato, valoresVacios } from './formularios';
import type { TipoDato, Valores } from './formularios';

export type RegistroLocal = {
  guardado: Valores | null;
  pendiente: boolean;
  borrador: Valores | null;
  /** Ultima vez (ms) que el usuario cambio algo. Sirve para reabrir el formulario donde se quedo. */
  editadoEn: number;
};

export const REGISTRO_VACIO: RegistroLocal = { guardado: null, pendiente: false, borrador: null, editadoEn: 0 };

const MAX_TEXTO = 60;

/** Solo campos conocidos, como texto y con largo acotado. Conserva lo escrito aunque todavia no sea valido. */
function copiarValores(tipo: TipoDato, crudo: unknown): Valores {
  const salida = valoresVacios(tipo);
  const origen = (crudo ?? {}) as Record<string, unknown>;
  for (const campo of camposDe(tipo)) {
    const v = origen[campo.id];
    if (typeof v === 'string') salida[campo.id] = v.slice(0, MAX_TEXTO);
  }
  return salida;
}

function esObjeto(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

/** Lee lo guardado en el telefono. Si esta corrupto o no existe devuelve un registro vacio (nunca lanza). */
export function leerRegistro(raw: string | null, tipo: TipoDato): RegistroLocal {
  if (!raw) return REGISTRO_VACIO;
  try {
    const d: unknown = JSON.parse(raw);
    if (!esObjeto(d)) return REGISTRO_VACIO;
    const guardado = esObjeto(d.guardado) ? copiarValores(tipo, d.guardado) : null;
    return {
      guardado,
      pendiente: guardado !== null && d.pendiente === true,
      borrador: esObjeto(d.borrador) ? copiarValores(tipo, d.borrador) : null,
      editadoEn: typeof d.editadoEn === 'number' && Number.isFinite(d.editadoEn) ? d.editadoEn : 0,
    };
  } catch {
    return REGISTRO_VACIO;
  }
}

export function serializarRegistro(r: RegistroLocal): string {
  return JSON.stringify(r);
}

export function registroEstaVacio(r: RegistroLocal): boolean {
  return r.guardado === null && r.borrador === null && !r.pendiente;
}

/** Igualdad exacta campo por campo (un campo ausente cuenta como vacio; se ignoran espacios en los extremos). */
export function igualesValores(a: Valores | null, b: Valores | null): boolean {
  if (a === null || b === null) return a === b;
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const id of ids) if ((a[id] ?? '').trim() !== (b[id] ?? '').trim()) return false;
  return true;
}

/** Igual que arriba pero comparando como lo hace el formulario al guardar: "$1,234.50" y "1234.50" son lo mismo. */
export function igualesNormalizados(tipo: TipoDato, a: Valores, b: Valores): boolean {
  return camposDe(tipo).every((c) => normalizar(c, a[c.id] ?? '') === normalizar(c, b[c.id] ?? ''));
}

function todoVacio(tipo: TipoDato, v: Valores): boolean {
  return camposDe(tipo).every((c) => (v[c.id] ?? '').trim() === '');
}

/**
 * Lo que el usuario lleva escrito. Si no difiere de lo guardado (o esta todo vacio y no hay nada guardado),
 * no hay borrador. Devuelve el MISMO objeto si nada cambia, para que el servicio se ahorre la escritura.
 */
export function conBorrador(r: RegistroLocal, tipo: TipoDato, valores: Valores, ahora: number): RegistroLocal {
  const sinCambios = r.guardado ? igualesNormalizados(tipo, r.guardado, valores) : todoVacio(tipo, valores);
  if (sinCambios) return r.borrador === null ? r : { ...r, borrador: null, editadoEn: ahora };
  const nuevo = copiarValores(tipo, valores);
  if (r.borrador && igualesValores(r.borrador, nuevo)) return r;
  return { ...r, borrador: nuevo, editadoEn: ahora };
}

/** El usuario pulso "Guardar": queda guardado en el telefono y pendiente de enviar. El borrador ya no hace falta. */
export function conGuardado(tipo: TipoDato, valores: Valores, ahora: number): RegistroLocal {
  return { guardado: copiarValores(tipo, valores), pendiente: true, borrador: null, editadoEn: ahora };
}

/** El servidor confirmo "enviado". Solo se marca al dia si el usuario no volvio a guardar mientras se enviaba. */
export function conEnviado(r: RegistroLocal, enviado: Valores): RegistroLocal {
  return r.pendiente && igualesValores(r.guardado, enviado) ? { ...r, pendiente: false } : r;
}

/** Con que valores abre el formulario: el borrador si lo hay, si no lo guardado, si no vacio. */
export function valoresIniciales(tipo: TipoDato, r: RegistroLocal): { valores: Valores; restaurado: boolean } {
  if (r.borrador) return { valores: r.borrador, restaurado: true };
  return { valores: r.guardado ?? valoresVacios(tipo), restaurado: false };
}

// ------------------------------------------------------------------- claves

export const PREFIJO_LOCAL = 'dinero.';

/** Solo letras, numeros, punto, guion y guion bajo: SecureStore no admite otros caracteres en la llave. */
export function claveLocal(uid: string, clave: string): string {
  return `${PREFIJO_LOCAL}${uid}.${clave}`;
}

export function prefijoDeUsuario(uid: string): string {
  return `${PREFIJO_LOCAL}${uid}.`;
}

/** "dinero.<uid>.anual-2025" -> "anual-2025"; null si la llave es de otro usuario o de otra cosa. */
export function claveDeLocal(uid: string, llave: string): string | null {
  const p = prefijoDeUsuario(uid);
  return llave.startsWith(p) ? llave.slice(p.length) : null;
}

/** "anual-2025" -> { tipo: 'anual', periodo: '2025' }; "cuenta" -> { tipo: 'cuenta', periodo: '' }; null si no es valida. */
export function partesDeClave(clave: string): { tipo: TipoDato; periodo: string } | null {
  if (!CLAVE_VALIDA.test(clave)) return null;
  if (clave === 'cuenta') return { tipo: 'cuenta', periodo: '' };
  const i = clave.indexOf('-');
  const tipo = clave.slice(0, i);
  return esTipoDato(tipo) ? { tipo, periodo: clave.slice(i + 1) } : null;
}

export type ResumenLocal = {
  clave: string;
  tipo: TipoDato;
  periodo: string;
  pendiente: boolean;
  /** Hay texto escrito que aun no se guarda. */
  borrador: boolean;
  editadoEn: number;
};

export function resumenDe(clave: string, r: RegistroLocal): ResumenLocal | null {
  const partes = partesDeClave(clave);
  if (!partes) return null;
  return { clave, ...partes, pendiente: r.pendiente, borrador: r.borrador !== null, editadoEn: r.editadoEn };
}

/** Periodo del tipo en el que el usuario trabajo por ultima vez (con borrador o pendiente). null si ninguno. */
export function periodoMasReciente(resumenes: readonly ResumenLocal[], tipo: TipoDato): string | null {
  let mejor: ResumenLocal | null = null;
  for (const r of resumenes) {
    if (r.tipo !== tipo || !r.periodo || !(r.borrador || r.pendiente)) continue;
    if (!mejor || r.editadoEn > mejor.editadoEn) mejor = r;
  }
  return mejor?.periodo ?? null;
}
