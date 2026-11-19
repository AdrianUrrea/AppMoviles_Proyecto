import { describe, expect, it } from 'vitest';
import {
  MAX_CENTAVOS,
  aCentavos,
  digitoVerificadorClabe,
  enmascararClabe,
  formatearMonto,
  montoParaCopiar,
  normalizarClabe,
  sumarCentavos,
  validarClabe,
  validarMonto,
} from '../montos';

describe('aCentavos', () => {
  it('interpreta formatos comunes', () => {
    expect(aCentavos('1234')).toBe(123400);
    expect(aCentavos('1234.5')).toBe(123450);
    expect(aCentavos('1234.56')).toBe(123456);
    expect(aCentavos('$1,234.56')).toBe(123456);
    expect(aCentavos('  $ 12,345,678.90 ')).toBe(1234567890);
    expect(aCentavos('$12.5')).toBe(1250);
    expect(aCentavos('0')).toBe(0);
    expect(aCentavos('0.01')).toBe(1);
  });

  it('rechaza lo que no es un monto', () => {
    for (const t of ['', 'abc', '12,5', '1,23', '1.234', '-5', '+5', '1e5', '.5', '5.', '1,2345', '12 34', '1 234', '$', '$ ', '1.2.3', '１２']) {
      expect(aCentavos(t), `"${t}"`).toBeNull();
    }
  });

  it('no sufre errores de coma flotante', () => {
    expect(sumarCentavos([aCentavos('0.1'), aCentavos('0.2')])).toBe(aCentavos('0.3'));
    expect(sumarCentavos([aCentavos('19.99'), aCentavos('0.01')])).toBe(2000);
  });
});

describe('formatos', () => {
  it('montoParaCopiar: sin comas ni signo, sin .00', () => {
    expect(montoParaCopiar(123400)).toBe('1234');
    expect(montoParaCopiar(123450)).toBe('1234.50');
    expect(montoParaCopiar(5)).toBe('0.05');
    expect(montoParaCopiar(0)).toBe('0');
  });
  it('montoParaCopiar y aCentavos son inversos', () => {
    for (const c of [0, 1, 99, 100, 123456, 1000000, MAX_CENTAVOS]) expect(aCentavos(montoParaCopiar(c))).toBe(c);
  });
  it('formatearMonto: con $ y comas', () => {
    expect(formatearMonto(123456)).toBe('$1,234.56');
    expect(formatearMonto(100)).toBe('$1.00');
    expect(formatearMonto(0)).toBe('$0.00');
    expect(formatearMonto(1234567890)).toBe('$12,345,678.90');
    expect(formatearMonto(-250050)).toBe('-$2,500.50');
  });
});

describe('validarMonto', () => {
  it('vacio es valido (campo opcional)', () => {
    expect(validarMonto('')).toBeNull();
    expect(validarMonto('   ')).toBeNull();
  });
  it('acepta montos validos y rechaza el resto', () => {
    expect(validarMonto('12500.50')).toBeNull();
    expect(validarMonto('abc')).toContain('monto válido');
    expect(validarMonto('-5')).toContain('monto válido');
  });
  it('limita el maximo', () => {
    expect(validarMonto('999999999.99')).toBeNull();
    expect(validarMonto('1000000000')).toBe('El monto es demasiado grande.');
  });
});

describe('CLABE', () => {
  // Ejemplos de la documentacion, cuyo digito verificador coincide con el algoritmo.
  const validas = ['002010077777777771', '032180000118359719'];

  it('acepta CLABE validas, tambien con espacios o guiones', () => {
    for (const c of validas) expect(validarClabe(c), c).toBeNull();
    expect(validarClabe('0020 1007 7777 7777 71')).toBeNull();
    expect(validarClabe('002-010-07777777777-1')).toBeNull();
  });
  it('detecta un digito mal escrito', () => {
    expect(validarClabe('002010077777777772')).toContain('no es válida');
    expect(validarClabe('012010077777777771')).toContain('no es válida');
  });
  it('detecta longitud incorrecta o letras', () => {
    expect(validarClabe('0020100777777777')).toBe('La CLABE debe tener 18 dígitos.');
    expect(validarClabe('0020100777777777711')).toBe('La CLABE debe tener 18 dígitos.');
    expect(validarClabe('00201007777777777A')).toBe('La CLABE debe tener 18 dígitos.');
  });
  it('vacio es valido (la obligatoriedad se controla aparte)', () => {
    expect(validarClabe('')).toBeNull();
  });
  it('calcula el digito verificador', () => {
    expect(digitoVerificadorClabe('00201007777777777')).toBe('1');
  });
  it('normaliza y oculta', () => {
    expect(normalizarClabe(' 0020-1007 7777 777771 ')).toBe('002010077777777771');
    expect(enmascararClabe('002010077777777771')).toBe('••••••••••••••7771');
  });
});
