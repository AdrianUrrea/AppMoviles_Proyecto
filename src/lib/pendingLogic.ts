/** Logica pura del "registro pendiente de confirmar" (sin dependencias, facil de probar). */

/** Mismo plazo que la limpieza de cuentas sin verificar en Supabase (24 h). */
export const VIGENCIA_PENDIENTE_MS = 24 * 60 * 60 * 1000;

export function serializarPendiente(correo: string, ahora: number): string {
  return JSON.stringify({ correo, at: ahora });
}

/** Devuelve el correo pendiente, o null si no hay, esta corrupto, vencio o la fecha es incoherente. */
export function leerPendiente(raw: string | null, ahora: number): string | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { correo?: unknown; at?: unknown };
    if (typeof d.correo !== 'string' || d.correo === '' || typeof d.at !== 'number') return null;
    const edad = ahora - d.at;
    if (edad < 0 || edad > VIGENCIA_PENDIENTE_MS) return null; // futuro (reloj cambiado) o vencido
    return d.correo;
  } catch {
    return null;
  }
}
