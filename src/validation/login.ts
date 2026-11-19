import { z } from 'zod';
import { LONGITUD_CODIGO } from './codigo';
import { MSG } from './mensajes';
import { correoSchema } from './registro';

export const loginSchema = z.object({
  correo: correoSchema,
  // En login solo se exige que exista; la politica de longitud aplica al registro.
  password: z.string().min(1, MSG.password.obligatoria),
});

export type LoginFormValues = z.input<typeof loginSchema>;

export const codigoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, MSG.codigo.obligatorio)
    .regex(new RegExp(`^\\d{${LONGITUD_CODIGO}}$`), MSG.codigo.formato),
});

export type CodigoFormValues = z.input<typeof codigoSchema>;
