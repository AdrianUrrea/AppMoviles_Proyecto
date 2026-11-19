import { describe, expect, it } from 'vitest';
import { MSG } from '../../validation/mensajes';
import {
  MAX_AVISOS_PROGRAMADOS,
  claveDia,
  combinarFechaHora,
  diasConRecordatorios,
  diferenciaSync,
  fechaEsPasada,
  filaARecordatorio,
  formatearFechaHoraLarga,
  formatearFechaLarga,
  formatearHora,
  validarHoraParaFecha,
} from '../logica';
import type { Recordatorio } from '../logica';

// 23-oct-2026, 10:00 hora local
const ahora = new Date(2026, 9, 23, 10, 0, 0);
const rec = (id: string, fecha: Date): Recordatorio => ({ id, titulo: `t-${id}`, fechaHora: fecha });

describe('combinarFechaHora', () => {
  it('combina fecha y hora locales', () => {
    const d = combinarFechaHora('2026-10-25', '14:30');
    expect(d).not.toBeNull();
    expect([d!.getFullYear(), d!.getMonth(), d!.getDate(), d!.getHours(), d!.getMinutes()]).toEqual([2026, 9, 25, 14, 30]);
  });
  it('acepta los extremos del dia', () => {
    expect(combinarFechaHora('2026-10-25', '00:00')).not.toBeNull();
    expect(combinarFechaHora('2026-10-25', '23:59')).not.toBeNull();
  });
  it('rechaza horas imposibles y formatos incompletos', () => {
    for (const h of ['24:00', '25:10', '12:60', '9:30', '12:5', '12-30', '', 'ab:cd', '12:30:00']) {
      expect(combinarFechaHora('2026-10-25', h), h).toBeNull();
    }
  });
  it('rechaza fechas inexistentes', () => {
    expect(combinarFechaHora('2026-02-30', '10:00')).toBeNull();
    expect(combinarFechaHora('basura', '10:00')).toBeNull();
  });
  it('acepta el 29 de febrero solo en bisiesto', () => {
    expect(combinarFechaHora('2028-02-29', '10:00')).not.toBeNull();
    expect(combinarFechaHora('2027-02-29', '10:00')).toBeNull();
  });
});

describe('claveDia y fechaEsPasada', () => {
  it('formatea en hora local', () => {
    expect(claveDia(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(claveDia(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });
  it('hoy NO es pasado; ayer SI', () => {
    expect(fechaEsPasada('2026-10-23', ahora)).toBe(false);
    expect(fechaEsPasada('2026-10-22', ahora)).toBe(true);
    expect(fechaEsPasada('2026-10-24', ahora)).toBe(false);
    expect(fechaEsPasada('2025-12-31', ahora)).toBe(true);
  });
});

describe('validarHoraParaFecha', () => {
  it('exige la hora', () => {
    expect(validarHoraParaFecha('2026-10-25', '', ahora)).toBe(MSG.recordatorio.hora.obligatoria);
  });
  it('rechaza horas invalidas', () => {
    expect(validarHoraParaFecha('2026-10-25', '25:00', ahora)).toBe(MSG.recordatorio.hora.invalida);
    expect(validarHoraParaFecha('2026-10-25', '1:', ahora)).toBe(MSG.recordatorio.hora.invalida);
  });
  it('rechaza dias pasados aunque la hora sea valida', () => {
    expect(validarHoraParaFecha('2026-10-22', '23:00', ahora)).toBe(MSG.recordatorio.fechaPasada);
  });
  it('hoy: rechaza horas pasadas o iguales a la actual, acepta futuras', () => {
    expect(validarHoraParaFecha('2026-10-23', '09:59', ahora)).toBe(MSG.recordatorio.hora.pasada);
    expect(validarHoraParaFecha('2026-10-23', '10:00', ahora)).toBe(MSG.recordatorio.hora.pasada);
    expect(validarHoraParaFecha('2026-10-23', '10:01', ahora)).toBeNull();
    expect(validarHoraParaFecha('2026-10-23', '23:59', ahora)).toBeNull();
  });
  it('dias futuros: cualquier hora valida, incluso 00:00', () => {
    expect(validarHoraParaFecha('2026-10-24', '00:00', ahora)).toBeNull();
    expect(validarHoraParaFecha('2030-01-01', '08:15', ahora)).toBeNull();
  });
});

describe('diasConRecordatorios', () => {
  it('agrupa varios recordatorios del mismo dia en una marca', () => {
    const dias = diasConRecordatorios([
      rec('a', new Date(2026, 9, 25, 8, 0)),
      rec('b', new Date(2026, 9, 25, 20, 0)),
      rec('c', new Date(2026, 9, 26, 9, 0)),
    ]);
    expect([...dias].sort()).toEqual(['2026-10-25', '2026-10-26']);
  });
  it('lista vacia -> sin marcas', () => {
    expect(diasConRecordatorios([]).size).toBe(0);
  });
});

describe('formatos en espanol', () => {
  it('fecha larga con dia de la semana', () => {
    expect(formatearFechaLarga({ y: 2026, m: 10, d: 23 })).toBe('viernes 23 de octubre de 2026');
    expect(formatearFechaLarga({ y: 2028, m: 2, d: 29 })).toBe('martes 29 de febrero de 2028');
  });
  it('hora con ceros a la izquierda en 24 h', () => {
    expect(formatearHora(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
    expect(formatearHora(new Date(2026, 0, 1, 0, 0))).toBe('00:00');
    expect(formatearHora(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
  });
  it('fecha y hora para la notificacion', () => {
    expect(formatearFechaHoraLarga(new Date(2026, 9, 23, 9, 5))).toBe('23 de octubre a las 09:05');
  });
});

describe('filaARecordatorio', () => {
  it('convierte la fila de la base de datos', () => {
    const r = filaARecordatorio({ id_recordatorio: 'x1', titulo: 'Pagar', fecha_hora: '2026-10-25T20:30:00.000Z' });
    expect(r.id).toBe('x1');
    expect(r.titulo).toBe('Pagar');
    expect(r.fechaHora.toISOString()).toBe('2026-10-25T20:30:00.000Z');
  });
});

describe('diferenciaSync', () => {
  const futuro = (n: number) => new Date(2026, 9, 24 + n, 9, 0);

  it('programa lo que falta y no repite lo ya programado', () => {
    const r = diferenciaSync([rec('a', futuro(1)), rec('b', futuro(2))], ['a'], ahora);
    expect(r.programar.map((x) => x.id)).toEqual(['b']);
    expect(r.cancelar).toEqual([]);
  });
  it('cancela avisos de recordatorios que ya no existen (eliminados en otro telefono)', () => {
    const r = diferenciaSync([rec('a', futuro(1))], ['a', 'fantasma'], ahora);
    expect(r.cancelar).toEqual(['fantasma']);
    expect(r.programar).toEqual([]);
  });
  it('ignora recordatorios pasados', () => {
    const r = diferenciaSync([rec('viejo', new Date(2026, 9, 1, 9, 0))], [], ahora);
    expect(r.programar).toEqual([]);
  });
  it('un recordatorio pasado que sigue programado se cancela', () => {
    const r = diferenciaSync([rec('viejo', new Date(2026, 9, 1, 9, 0))], ['viejo'], ahora);
    expect(r.cancelar).toEqual(['viejo']);
  });
  it('respeta el limite y conserva los mas proximos', () => {
    const muchos = Array.from({ length: 70 }, (_, i) => rec(`r${i}`, new Date(2026, 9, 24, 9, i)));
    const r = diferenciaSync(muchos, [], ahora);
    expect(r.programar).toHaveLength(MAX_AVISOS_PROGRAMADOS);
    expect(r.programar[0].id).toBe('r0');
    expect(r.programar.at(-1)!.id).toBe(`r${MAX_AVISOS_PROGRAMADOS - 1}`);
  });
  it('si ya hay avisos fuera del top, los cancela', () => {
    const muchos = Array.from({ length: 5 }, (_, i) => rec(`r${i}`, new Date(2026, 9, 24, 9, i)));
    const r = diferenciaSync(muchos, ['r0', 'r1', 'r4'], ahora, 3);
    expect(r.cancelar).toEqual(['r4']);
    expect(r.programar.map((x) => x.id)).toEqual(['r2']);
  });
  it('no depende del orden de entrada y no modifica el arreglo recibido', () => {
    const entrada = [rec('b', futuro(2)), rec('a', futuro(1))];
    const copia = [...entrada];
    const r = diferenciaSync(entrada, [], ahora);
    expect(r.programar.map((x) => x.id)).toEqual(['a', 'b']);
    expect(entrada).toEqual(copia);
  });
});
