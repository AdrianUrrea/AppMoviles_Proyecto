import { z } from 'zod';
import { validarNacimiento } from './fechas';
import { MSG } from './mensajes';
import { rfcCoincideConNacimiento, validarRfc } from './rfc';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Letras latinas con acentos y n con tilde; espacios, apostrofe, punto y guion. Sin emojis ni digitos.
const NOMBRE = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' .-]*$/;

export const correoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, MSG.correo.obligatorio)
  .max(254, MSG.correo.invalido)
  .regex(CORREO, MSG.correo.invalido);

const nombreSchema = (m: { obligatorio: string; invalido: string; muyLargo: string }) =>
  z
    .string()
    .trim()
    .min(1, m.obligatorio)
    .max(60, m.muyLargo)
    .regex(NOMBRE, m.invalido);

const textoObligatorio = (mensaje: string) =>
  z.string().trim().min(1, mensaje).max(100, MSG.domicilio.muyLargo);

/** Campos del domicilio. Los usan el registro y la edicion del perfil, para que las reglas sean siempre las mismas. */
export const domicilioCampos = {
  calle: textoObligatorio(MSG.domicilio.calle),
  numExt: z.string().trim().min(1, MSG.domicilio.numExt).max(20, MSG.domicilio.muyLargo),
  numInt: z.string().trim().max(20, MSG.domicilio.muyLargo),
  colonia: textoObligatorio(MSG.domicilio.colonia),
  cp: z
    .string()
    .trim()
    .min(1, MSG.domicilio.cpObligatorio)
    .regex(/^\d{5}$/, MSG.domicilio.cpInvalido),
  municipio: textoObligatorio(MSG.domicilio.municipio),
  estado: textoObligatorio(MSG.domicilio.estado),
};

/** Reglas de una contraseña nueva (registro y cambio de contraseña). */
export const passwordSchema = z
  .string()
  .min(1, MSG.password.obligatoria)
  .min(8, MSG.password.muyCorta)
  .max(72, MSG.password.muyLarga); // limite de bcrypt

export const registroSchema = z
  .object({
    correo: correoSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, MSG.confirmPassword.obligatoria),
    nombre: nombreSchema(MSG.nombre),
    apellidoPaterno: nombreSchema(MSG.apellidoPaterno),
    apellidoMaterno: z
      .string()
      .trim()
      .max(60, MSG.apellidoMaterno.muyLargo)
      .refine((v) => v === '' || NOMBRE.test(v), MSG.apellidoMaterno.invalido),
    nacimiento: z.string().superRefine((valor, ctx) => {
      const error = validarNacimiento(valor);
      if (error) ctx.addIssue({ code: 'custom', message: error });
    }),
    rfc: z
      .string()
      .trim()
      .toUpperCase()
      .superRefine((valor, ctx) => {
        const error = validarRfc(valor);
        if (error) ctx.addIssue({ code: 'custom', message: error });
      }),
    ...domicilioCampos,
    aceptoPrivacidad: z.boolean().refine((v) => v === true, MSG.privacidad.obligatoria),
  })
  .superRefine((d, ctx) => {
    if (d.confirmPassword && d.password !== d.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: MSG.confirmPassword.noCoincide });
    }
    if (d.password && d.password.trim().toLowerCase() === d.correo) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: MSG.password.igualAlCorreo });
    }
    // Solo se compara si ambos campos ya son validos por separado (evita errores duplicados).
    if (
      validarRfc(d.rfc) === null &&
      validarNacimiento(d.nacimiento) === null &&
      !rfcCoincideConNacimiento(d.rfc, d.nacimiento)
    ) {
      ctx.addIssue({ code: 'custom', path: ['rfc'], message: MSG.rfc.noCoincideConNacimiento });
    }
  });

/** Lo que escribe el usuario en el formulario. */
export type RegistroFormValues = z.input<typeof registroSchema>;
/** Lo que queda despues de validar y normalizar (trim, minusculas, RFC en mayusculas). */
export type RegistroData = z.output<typeof registroSchema>;

export const REGISTRO_DEFAULTS: RegistroFormValues = {
  correo: '',
  password: '',
  confirmPassword: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  nacimiento: '',
  rfc: '',
  calle: '',
  numExt: '',
  numInt: '',
  colonia: '',
  cp: '',
  municipio: '',
  estado: '',
  aceptoPrivacidad: false,
};
