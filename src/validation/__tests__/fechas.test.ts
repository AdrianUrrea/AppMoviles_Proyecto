import { describe, expect, it } from 'vitest';
import { calcularEdad, fechaParaRfc, parseFechaIso, validarNacimiento } from '../fechas';
import { MSG } from '../mensajes';

const hoy = new Date(2026, 9, 22); // 22-oct-2026 (hora local)

describe('parseFechaIso', () => {
  it('acepta fechas reales', () => {
    expect(parseFechaIso('1990-03-05')).toEqual({ y: 1990, m: 3, d: 5 });
  });
  it('acepta 29 de febrero solo en bisiesto', () => {
    expect(parseFechaIso('2000-02-29')).not.toBeNull();
    expect(parseFechaIso('1900-02-29')).toBeNull(); // 1900 no es bisiesto
    expect(parseFechaIso('2001-02-29')).toBeNull();
  });
  it('rechaza formatos y dias inexistentes', () => {
    expect(parseFechaIso('2001-02-30')).toBeNull();
    expect(parseFechaIso('2001-13-01')).toBeNull();
    expect(parseFechaIso('05/03/1990')).toBeNull();
    expect(parseFechaIso('1990-3-5')).toBeNull();
    expect(parseFechaIso('')).toBeNull();
  });
});

describe('calcularEdad', () => {
  it('cuenta el cumpleanos exacto', () => {
    expect(calcularEdad({ y: 2008, m: 10, d: 22 }, hoy)).toBe(18);
    expect(calcularEdad({ y: 2008, m: 10, d: 23 }, hoy)).toBe(17);
  });
  it('maneja nacidos el 29 de febrero', () => {
    const f = { y: 2000, m: 2, d: 29 };
    expect(calcularEdad(f, new Date(2026, 1, 28))).toBe(25);
    expect(calcularEdad(f, new Date(2026, 2, 1))).toBe(26);
  });
});

describe('validarNacimiento', () => {
  it('exige el campo', () => {
    expect(validarNacimiento('', hoy)).toBe(MSG.nacimiento.obligatoria);
  });
  it('rechaza fechas inexistentes', () => {
    expect(validarNacimiento('2001-02-30', hoy)).toBe(MSG.nacimiento.invalida);
  });
  it('rechaza fechas futuras', () => {
    expect(validarNacimiento('2026-10-23', hoy)).toBe(MSG.nacimiento.futura);
    expect(validarNacimiento('2030-01-01', hoy)).toBe(MSG.nacimiento.futura);
  });
  it('rechaza menores de 18 (limite exacto)', () => {
    expect(validarNacimiento('2008-10-23', hoy)).toBe(MSG.nacimiento.menorDeEdad);
    expect(validarNacimiento('2008-10-22', hoy)).toBeNull();
  });
  it('rechaza mayores de 120', () => {
    expect(validarNacimiento('1905-10-22', hoy)).toBe(MSG.nacimiento.invalida); // 121 anios
    expect(validarNacimiento('1905-10-23', hoy)).toBeNull(); // 120 anios, aun valido
  });
});

describe('fechaParaRfc', () => {
  it('formatea YYMMDD', () => {
    expect(fechaParaRfc('1990-03-05')).toBe('900305');
    expect(fechaParaRfc('2003-12-31')).toBe('031231');
    expect(fechaParaRfc('basura')).toBeNull();
  });
});
