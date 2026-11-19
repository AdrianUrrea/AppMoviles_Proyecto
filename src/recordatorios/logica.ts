import { parseFechaIso } from '../validation/fechas';
import type { FechaIso } from '../validation/fechas';
import { MSG } from '../validation/mensajes';
import { DIAS_SEMANA, MESES } from './nombres';

export type Recordatorio = { id: string; titulo: string; fechaHora: Date };
export type FilaRecordatorio = { id_recordatorio: string; titulo: string; fecha_hora: string };

/** iOS permite ~64 notificaciones locales pendientes; se dejan 4 de margen. */
export const MAX_AVISOS_PROGRAMADOS = 60;

const dos = (n: number) => String(n).padStart(2, '0');

export function filaARecordatorio(f: FilaRecordatorio): Recordatorio {
  return { id: f.id_recordatorio, titulo: f.titulo, fechaHora: new Date(f.fecha_hora) };
}

/** "YYYY-MM-DD" en hora LOCAL del dispositivo. */
export function claveDia(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Combina "YYYY-MM-DD" y "HH:MM" (24 h) en una fecha local. null si no existe (hora 25:00, o un hueco de horario de verano). */
export function combinarFechaHora(fechaIso: string, hora: string): Date | null {
  const f = parseFechaIso(fechaIso);
  const m = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!f || !m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  const d = new Date(f.y, f.m - 1, f.d, hh, mm, 0, 0);
  const coincide =
    d.getFullYear() === f.y &&
    d.getMonth() === f.m - 1 &&
    d.getDate() === f.d &&
    d.getHours() === hh &&
    d.getMinutes() === mm;
  return coincide ? d : null;
}

/** El dia (sin hora) ya paso. Las fechas ISO se comparan como texto. */
export function fechaEsPasada(fechaIso: string, ahora: Date): boolean {
  return fechaIso < claveDia(ahora);
}

/** Mensaje de error o null si la hora es valida para agendar en ese dia. */
export function validarHoraParaFecha(fechaIso: string, hora: string, ahora: Date): string | null {
  if (!hora) return MSG.recordatorio.hora.obligatoria;
  const fechaHora = combinarFechaHora(fechaIso, hora);
  if (!fechaHora) return MSG.recordatorio.hora.invalida;
  if (fechaEsPasada(fechaIso, ahora)) return MSG.recordatorio.fechaPasada;
  if (fechaHora.getTime() <= ahora.getTime()) return MSG.recordatorio.hora.pasada;
  return null;
}

/** Dias (YYYY-MM-DD) que tienen al menos un recordatorio: para los puntos del calendario. */
export function diasConRecordatorios(items: readonly Recordatorio[]): Set<string> {
  return new Set(items.map((r) => claveDia(r.fechaHora)));
}

export function formatearHora(d: Date): string {
  return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** "viernes 23 de octubre de 2026" */
export function formatearFechaLarga(f: FechaIso): string {
  const dia = DIAS_SEMANA[new Date(f.y, f.m - 1, f.d).getDay()];
  return `${dia} ${f.d} de ${MESES[f.m - 1]} de ${f.y}`;
}

/** "23 de octubre a las 09:05" */
export function formatearFechaHoraLarga(d: Date): string {
  return `${d.getDate()} de ${MESES[d.getMonth()]} a las ${formatearHora(d)}`;
}

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Compara lo que DEBE estar programado (los proximos `max` recordatorios futuros)
 * con lo que YA lo esta, y dice que programar y que cancelar.
 */
export function diferenciaSync(
  deseados: readonly Recordatorio[],
  programadosIds: readonly string[],
  ahora: Date,
  max: number = MAX_AVISOS_PROGRAMADOS,
): { programar: Recordatorio[]; cancelar: string[] } {
  const proximos = deseados
    .filter((r) => r.fechaHora.getTime() > ahora.getTime())
    .sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime())
    .slice(0, max);
  const idsDeseados = new Set(proximos.map((r) => r.id));
  const yaProgramados = new Set(programadosIds);
  return {
    programar: proximos.filter((r) => !yaProgramados.has(r.id)),
    cancelar: programadosIds.filter((id) => !idsDeseados.has(id)),
  };
}
