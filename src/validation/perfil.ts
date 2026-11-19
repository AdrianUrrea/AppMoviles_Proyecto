import { z } from 'zod';
import { domicilioCampos } from './registro';

/** Formulario para editar el domicilio del perfil (mismas reglas que en el registro). */
export const domicilioSchema = z.object(domicilioCampos);

/** Lo que escribe el usuario. */
export type DomicilioFormValues = z.input<typeof domicilioSchema>;
/** Lo que queda despues de validar y recortar espacios. */
export type DomicilioData = z.output<typeof domicilioSchema>;
