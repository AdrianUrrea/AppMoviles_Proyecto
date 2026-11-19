import { z } from 'zod';
import { MSG } from '../validation/mensajes';

export const documentoNuevoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, MSG.documento.nombre.obligatorio)
    .max(80, MSG.documento.nombre.muyLargo),
});

export type DocumentoNuevoFormValues = z.input<typeof documentoNuevoSchema>;
export type DocumentoNuevoData = z.output<typeof documentoNuevoSchema>;
