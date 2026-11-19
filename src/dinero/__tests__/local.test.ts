import { describe, expect, it } from 'vitest';
import { valoresVacios } from '../formularios';
import {
  REGISTRO_VACIO,
  claveDeLocal,
  claveLocal,
  conBorrador,
  conEnviado,
  conGuardado,
  igualesNormalizados,
  igualesValores,
  leerRegistro,
  partesDeClave,
  periodoMasReciente,
  registroEstaVacio,
  resumenDe,
  serializarRegistro,
  valoresIniciales,
} from '../local';

const vacios = () => valoresVacios('anual');
const con = (cambios: Record<string, string>) => ({ ...vacios(), ...cambios });

describe('leerRegistro', () => {
  it('sin datos, corrupto o de otra forma -> registro vacio', () => {
    expect(leerRegistro(null, 'anual')).toEqual(REGISTRO_VACIO);
    expect(leerRegistro('', 'anual')).toEqual(REGISTRO_VACIO);
    expect(leerRegistro('{no es json', 'anual')).toEqual(REGISTRO_VACIO);
    expect(leerRegistro('[1,2]', 'anual')).toEqual(REGISTRO_VACIO);
    expect(leerRegistro('null', 'anual')).toEqual(REGISTRO_VACIO);
  });

  it('ida y vuelta conserva todo', () => {
    const r = { guardado: con({ ing_salarios: '1000' }), pendiente: true, borrador: con({ ing_salarios: '12abc' }), editadoEn: 5 };
    expect(leerRegistro(serializarRegistro(r), 'anual')).toEqual(r);
  });

  it('el borrador conserva texto invalido (se restaura tal cual lo escribio el usuario)', () => {
    const r = { ...REGISTRO_VACIO, borrador: con({ ing_salarios: '12abc' }) };
    expect(leerRegistro(serializarRegistro(r), 'anual').borrador?.ing_salarios).toBe('12abc');
  });

  it('ignora campos desconocidos y valores que no son texto, y acota el largo', () => {
    const raw = JSON.stringify({
      guardado: { ing_salarios: 5, ing_otros: 'x'.repeat(100), intruso: 'hola' },
      pendiente: true,
    });
    const r = leerRegistro(raw, 'anual');
    expect(r.guardado?.ing_salarios).toBe('');
    expect(r.guardado?.ing_otros).toHaveLength(60);
    expect(r.guardado && 'intruso' in r.guardado).toBe(false);
  });

  it('"pendiente" sin nada guardado no tiene sentido y se descarta', () => {
    expect(leerRegistro(JSON.stringify({ pendiente: true }), 'anual').pendiente).toBe(false);
  });
});

describe('conBorrador', () => {
  it('lo escrito se guarda como borrador', () => {
    const r = conBorrador(REGISTRO_VACIO, 'anual', con({ ing_salarios: '500' }), 10);
    expect(r.borrador?.ing_salarios).toBe('500');
    expect(r.editadoEn).toBe(10);
  });

  it('formulario vacio y nada guardado: no hay borrador (y devuelve el mismo objeto)', () => {
    expect(conBorrador(REGISTRO_VACIO, 'anual', vacios(), 10)).toBe(REGISTRO_VACIO);
  });

  it('si el usuario deja todo vacio, el borrador anterior se quita', () => {
    const r = conBorrador(REGISTRO_VACIO, 'anual', con({ ing_salarios: '500' }), 10);
    const sin = conBorrador(r, 'anual', vacios(), 20);
    expect(sin.borrador).toBeNull();
    expect(registroEstaVacio(sin)).toBe(true);
  });

  it('igual a lo guardado (aunque escrito distinto, "$1,234.50" = "1234.50") no es borrador', () => {
    const base = conGuardado('anual', con({ ing_salarios: '1234.50' }), 1);
    expect(conBorrador(base, 'anual', con({ ing_salarios: '$1,234.50' }), 2)).toBe(base);
  });

  it('distinto a lo guardado si es borrador, y no toca lo guardado ni lo pendiente', () => {
    const base = conGuardado('anual', con({ ing_salarios: '1000' }), 1);
    const r = conBorrador(base, 'anual', con({ ing_salarios: '2000' }), 2);
    expect(r.borrador?.ing_salarios).toBe('2000');
    expect(r.guardado?.ing_salarios).toBe('1000');
    expect(r.pendiente).toBe(true);
  });

  it('el mismo borrador otra vez no reescribe (devuelve el mismo objeto)', () => {
    const r = conBorrador(REGISTRO_VACIO, 'anual', con({ ing_salarios: '500' }), 10);
    expect(conBorrador(r, 'anual', con({ ing_salarios: '500' }), 99)).toBe(r);
  });
});

describe('conGuardado / conEnviado', () => {
  it('guardar deja pendiente y borra el borrador', () => {
    const r = conGuardado('anual', con({ ing_salarios: '700' }), 3);
    expect(r.pendiente).toBe(true);
    expect(r.borrador).toBeNull();
    expect(r.guardado?.ing_salarios).toBe('700');
  });

  it('enviado correctamente -> ya no esta pendiente', () => {
    const r = conGuardado('anual', con({ ing_salarios: '700' }), 3);
    expect(conEnviado(r, con({ ing_salarios: '700' })).pendiente).toBe(false);
  });

  it('si el usuario volvio a guardar mientras se enviaba, SIGUE pendiente (se enviara la version nueva)', () => {
    const viejo = con({ ing_salarios: '700' });
    const nuevo = conGuardado('anual', con({ ing_salarios: '900' }), 4);
    expect(conEnviado(nuevo, viejo).pendiente).toBe(true);
  });
});

describe('valoresIniciales', () => {
  it('prioridad: borrador > guardado > vacio', () => {
    const g = conGuardado('anual', con({ ing_salarios: '1' }), 1);
    expect(valoresIniciales('anual', REGISTRO_VACIO)).toEqual({ valores: vacios(), restaurado: false });
    expect(valoresIniciales('anual', g)).toEqual({ valores: g.guardado, restaurado: false });
    const b = conBorrador(g, 'anual', con({ ing_salarios: '2' }), 2);
    expect(valoresIniciales('anual', b)).toEqual({ valores: b.borrador, restaurado: true });
  });
});

describe('igualdad', () => {
  it('campo ausente cuenta como vacio', () => {
    expect(igualesValores({ a: '' }, {})).toBe(true);
    expect(igualesValores({ a: '1' }, {})).toBe(false);
    expect(igualesValores(null, null)).toBe(true);
    expect(igualesValores(null, {})).toBe(false);
  });
  it('normalizada: monto y CLABE', () => {
    expect(igualesNormalizados('anual', con({ ing_salarios: '1,000' }), con({ ing_salarios: '$1000.00' }))).toBe(true);
    expect(igualesNormalizados('anual', con({ ing_salarios: '1000' }), con({ ing_salarios: '1001' }))).toBe(false);
  });
});

describe('claves locales', () => {
  const uid = '3f2a9c1e-1111-4222-8333-444455556666';
  it('cada usuario tiene su propio espacio', () => {
    const llave = claveLocal(uid, 'anual-2025');
    expect(claveDeLocal(uid, llave)).toBe('anual-2025');
    expect(claveDeLocal('otro-usuario', llave)).toBeNull();
  });
  it('la llave solo usa caracteres que admite SecureStore', () => {
    for (const clave of ['anual-2025', 'mensual-2026-10', 'cuenta']) {
      expect(claveLocal(uid, clave)).toMatch(/^[A-Za-z0-9._-]+$/);
    }
  });
  it('partesDeClave', () => {
    expect(partesDeClave('anual-2025')).toEqual({ tipo: 'anual', periodo: '2025' });
    expect(partesDeClave('mensual-2026-10')).toEqual({ tipo: 'mensual', periodo: '2026-10' });
    expect(partesDeClave('cuenta')).toEqual({ tipo: 'cuenta', periodo: '' });
    expect(partesDeClave('mensual-2026-13')).toBeNull();
    expect(partesDeClave('otra')).toBeNull();
  });
});

describe('periodoMasReciente', () => {
  const r = (clave: string, extra: object, editadoEn: number) =>
    resumenDe(clave, { ...REGISTRO_VACIO, editadoEn, ...extra })!;

  it('abre en el periodo con borrador o pendiente editado por ultima vez', () => {
    const lista = [
      r('anual-2024', { borrador: con({ ing_otros: '1' }) }, 100),
      r('anual-2023', { guardado: con({ ing_otros: '2' }), pendiente: true }, 300),
      r('anual-2022', { guardado: con({ ing_otros: '3' }) }, 900), // ya enviado y sin borrador: no cuenta
      r('mensual-2026-10', { borrador: con({}) }, 999), // otro tipo
    ];
    expect(periodoMasReciente(lista, 'anual')).toBe('2023');
  });
  it('sin nada a medias -> null', () => {
    expect(periodoMasReciente([], 'anual')).toBeNull();
    expect(periodoMasReciente([r('anual-2022', { guardado: con({}) }, 5)], 'anual')).toBeNull();
  });
});
