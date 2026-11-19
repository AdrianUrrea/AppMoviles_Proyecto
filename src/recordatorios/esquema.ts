import { z } from 'zod';
import { MSG } from '../validation/mensajes';
import { validarHoraParaFecha } from './logica';

/**
 * Esquema del formulario "Nuevo recordatorio" para un dia concreto.
 * Se crea por dia porque la validez de la hora depende de la fecha elegida.
 * `ahora` se inyecta para poder probarlo con una hora fija.
 */
export function crearEsquemaRecordatorio(fechaIso: string, ahora: () => Date = () => new Date()) {
  return z.object({
    titulo: z
      .string()
      .trim()
      .min(1, MSG.recordatorio.titulo.obligatorio)
      .max(80, MSG.recordatorio.titulo.muyLargo),
    hora: z.string().superRefine((valor, ctx) => {
      const error = validarHoraParaFecha(fechaIso, valor, ahora());
      if (error) ctx.addIssue({ code: 'custom', message: error });
    }),
  });
}

export type RecordatorioFormValues = z.input<ReturnType<typeof crearEsquemaRecordatorio>>;
export type RecordatorioData = z.output<ReturnType<typeof crearEsquemaRecordatorio>>;
