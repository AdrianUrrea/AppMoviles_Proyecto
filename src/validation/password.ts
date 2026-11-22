import { z } from 'zod';
import { MSG } from './mensajes';
import { passwordSchema } from './registro';

/**
 * Cambio de contraseña: la actual (para confirmar que es la persona), la nueva y su confirmacion.
 * La nueva sigue las mismas reglas que en el registro y ademas debe ser distinta de la actual y del correo.
 */
export function crearCambioPasswordSchema(correo: string) {
  const correoNormal = correo.trim().toLowerCase();
  return z
    .object({
      actual: z.string().min(1, MSG.password.actualObligatoria),
      nueva: passwordSchema,
      confirmar: z.string().min(1, MSG.confirmPassword.obligatoria),
    })
    .superRefine((d, ctx) => {
      if (d.confirmar && d.nueva !== d.confirmar) {
        ctx.addIssue({ code: 'custom', path: ['confirmar'], message: MSG.confirmPassword.noCoincide });
      }
      if (d.nueva && d.actual && d.nueva === d.actual) {
        ctx.addIssue({ code: 'custom', path: ['nueva'], message: MSG.password.igualALaActual });
      }
      if (d.nueva && correoNormal && d.nueva.trim().toLowerCase() === correoNormal) {
        ctx.addIssue({ code: 'custom', path: ['nueva'], message: MSG.password.igualAlCorreo });
      }
    });
}

export type CambioPasswordFormValues = { actual: string; nueva: string; confirmar: string };
