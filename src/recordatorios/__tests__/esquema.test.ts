import { describe, expect, it } from 'vitest';
import { MSG } from '../../validation/mensajes';
import { crearEsquemaRecordatorio } from '../esquema';

const ahora = () => new Date(2026, 9, 23, 10, 0, 0); // 23-oct-2026 10:00

function errores(fecha: string, datos: { titulo: string; hora: string }) {
  const r = crearEsquemaRecordatorio(fecha, ahora).safeParse(datos);
  if (r.success) return {} as Record<string, string>;
  const out: Record<string, string> = {};
  for (const i of r.error.issues) {
    const campo = String(i.path[0]);
    if (!(campo in out)) out[campo] = i.message;
  }
  return out;
}

describe('esquema de recordatorio', () => {
  it('acepta un recordatorio futuro y recorta el titulo', () => {
    const r = crearEsquemaRecordatorio('2026-10-25', ahora).safeParse({ titulo: '  Pagar luz  ', hora: '14:30' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.titulo).toBe('Pagar luz');
  });
  it('exige titulo; un titulo solo con espacios cuenta como vacio', () => {
    expect(errores('2026-10-25', { titulo: '', hora: '14:30' }).titulo).toBe(MSG.recordatorio.titulo.obligatorio);
    expect(errores('2026-10-25', { titulo: '    ', hora: '14:30' }).titulo).toBe(MSG.recordatorio.titulo.obligatorio);
  });
  it('limita el titulo a 80 caracteres', () => {
    expect(errores('2026-10-25', { titulo: 'a'.repeat(80), hora: '14:30' })).toEqual({});
    expect(errores('2026-10-25', { titulo: 'a'.repeat(81), hora: '14:30' }).titulo).toBe(MSG.recordatorio.titulo.muyLargo);
  });
  it('acepta emojis y acentos en el titulo', () => {
    expect(errores('2026-10-25', { titulo: 'Cumpleaños de mamá 🎂', hora: '09:00' })).toEqual({});
  });
  it('marca titulo y hora a la vez cuando ambos faltan', () => {
    const e = errores('2026-10-25', { titulo: '', hora: '' });
    expect(e.titulo).toBe(MSG.recordatorio.titulo.obligatorio);
    expect(e.hora).toBe(MSG.recordatorio.hora.obligatoria);
  });
  it('rechaza hora incompleta o imposible', () => {
    expect(errores('2026-10-25', { titulo: 'x', hora: '14:' }).hora).toBe(MSG.recordatorio.hora.invalida);
    expect(errores('2026-10-25', { titulo: 'x', hora: '24:00' }).hora).toBe(MSG.recordatorio.hora.invalida);
  });
  it('en el dia de hoy rechaza una hora que ya paso', () => {
    expect(errores('2026-10-23', { titulo: 'x', hora: '08:00' }).hora).toBe(MSG.recordatorio.hora.pasada);
    expect(errores('2026-10-23', { titulo: 'x', hora: '18:00' })).toEqual({});
  });
  it('rechaza dias pasados', () => {
    expect(errores('2026-10-22', { titulo: 'x', hora: '23:59' }).hora).toBe(MSG.recordatorio.fechaPasada);
  });
});
