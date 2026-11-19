import { z } from 'zod';
import { aCentavos, montoParaCopiar, normalizarClabe, validarClabe, validarMonto } from './montos';
import { camposDe } from './formularios';
import type { CampoDinero, TipoDato } from './formularios';

export function normalizar(campo: CampoDinero, valor: string): string {
  const t = valor.trim();
  if (campo.tipo === 'clabe') return normalizarClabe(t);
  if (campo.tipo === 'monto') {
    const c = aCentavos(t);
    return c === null ? t : montoParaCopiar(c); // "$1,234.50" -> "1234.50" (forma canonica)
  }
  return t;
}

function validar(campo: CampoDinero, valor: string): string | null {
  if (!valor) return campo.obligatorio ? 'Este campo es obligatorio.' : null;
  if (campo.tipo === 'monto') return validarMonto(valor);
  if (campo.tipo === 'clabe') return validarClabe(valor);
  return valor.length > 60 ? 'Este campo no puede tener más de 60 caracteres.' : null;
}

/** Esquema del formulario de un tipo de dato. Normaliza (quita $ y comas) y valida cada campo. */
export function crearEsquemaDinero(tipo: TipoDato) {
  const forma: Record<string, z.ZodType<string, string>> = {};
  for (const campo of camposDe(tipo)) {
    forma[campo.id] = z
      .string()
      .transform((v) => normalizar(campo, v))
      .superRefine((v, ctx) => {
        const error = validar(campo, v);
        if (error) ctx.addIssue({ code: 'custom', message: error });
      });
  }
  return z.object(forma);
}
