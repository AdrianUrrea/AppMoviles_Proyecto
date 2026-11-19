import { MSG } from './mensajes';

export const EDAD_MINIMA = 18;
export const EDAD_MAXIMA = 120;

export type FechaIso = { y: number; m: number; d: number };

/** Parsea "YYYY-MM-DD" sin zonas horarias. Devuelve null si no existe ese dia (p. ej. 2001-02-30). */
export function parseFechaIso(valor: string): FechaIso | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  if (
    fecha.getUTCFullYear() !== y ||
    fecha.getUTCMonth() !== m - 1 ||
    fecha.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

/** Edad cumplida a la fecha `hoy` (hora local del dispositivo). */
export function calcularEdad(f: FechaIso, hoy: Date = new Date()): number {
  let edad = hoy.getFullYear() - f.y;
  const mes = hoy.getMonth() + 1;
  const dia = hoy.getDate();
  if (mes < f.m || (mes === f.m && dia < f.d)) edad -= 1;
  return edad;
}

function esFutura(f: FechaIso, hoy: Date): boolean {
  const h = hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate();
  return f.y * 10000 + f.m * 100 + f.d > h;
}

/** Devuelve el mensaje de error o null si la fecha de nacimiento es valida. */
export function validarNacimiento(valor: string, hoy: Date = new Date()): string | null {
  if (!valor) return MSG.nacimiento.obligatoria;
  const f = parseFechaIso(valor);
  if (!f) return MSG.nacimiento.invalida;
  if (esFutura(f, hoy)) return MSG.nacimiento.futura;
  const edad = calcularEdad(f, hoy);
  if (edad < EDAD_MINIMA) return MSG.nacimiento.menorDeEdad;
  if (edad > EDAD_MAXIMA) return MSG.nacimiento.invalida;
  return null;
}

/** "1990-03-05" -> "900305" (la parte de fecha del RFC). */
export function fechaParaRfc(valor: string): string | null {
  const f = parseFechaIso(valor);
  if (!f) return null;
  const yy = String(f.y % 100).padStart(2, '0');
  const mm = String(f.m).padStart(2, '0');
  const dd = String(f.d).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}
