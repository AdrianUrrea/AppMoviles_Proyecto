import { describe, expect, it } from 'vitest';
import {
  CONCEPTOS_ACUMULADOS,
  acumularEjercicio,
  aplicarSugeridos,
  ajustesDe,
  combinarMensuales,
  describirAjuste,
  listaDeMeses,
  mesesEsperados,
  valoresSugeridos,
} from '../acumulado';
import type { RegistroMensual } from '../acumulado';
import { camposDe, sanearValores, valoresVacios } from '../formularios';
import type { Valores } from '../formularios';
import { filasParaCopiar } from '../formularios';

const mes = (periodo: string, datos: Record<string, string>): RegistroMensual => ({
  periodo,
  valores: { ...valoresVacios('mensual'), ...datos },
});

const AHORA = new Date(2027, 3, 10); // abril de 2027: ya se puede declarar el ejercicio 2026

describe('CONCEPTOS_ACUMULADOS apunta a campos que existen', () => {
  it('cada concepto une un campo mensual y un campo anual reales, y de tipo monto', () => {
    const mensuales = new Map(camposDe('mensual').map((c) => [c.id, c.tipo]));
    const anuales = new Map(camposDe('anual').map((c) => [c.id, c.tipo]));
    for (const c of CONCEPTOS_ACUMULADOS) {
      expect(mensuales.get(c.mensual), `mensual:${c.mensual}`).toBe('monto');
      expect(anuales.get(c.anual), `anual:${c.anual}`).toBe('monto');
    }
  });
  it('no se repite ningun campo (cada suma llena un solo campo y viceversa)', () => {
    expect(new Set(CONCEPTOS_ACUMULADOS.map((c) => c.mensual)).size).toBe(CONCEPTOS_ACUMULADOS.length);
    expect(new Set(CONCEPTOS_ACUMULADOS.map((c) => c.anual)).size).toBe(CONCEPTOS_ACUMULADOS.length);
  });
  it('NO se suma "pagos anteriores del año": ya es un acumulado y duplicaria los pagos', () => {
    expect(CONCEPTOS_ACUMULADOS.some((c) => c.mensual === 'pagos_ant')).toBe(false);
  });
});

describe('acumularEjercicio', () => {
  it('suma los 12 meses del ejercicio, concepto por concepto', () => {
    const registros = Array.from({ length: 12 }, (_, i) =>
      mes(`2026-${String(i + 1).padStart(2, '0')}`, { ing_mes: '10000', ded_mes: '2500.50', isr_ret_mes: '100', isr_pagado_mes: '300.25' }),
    );
    const a = acumularEjercicio('2026', registros, AHORA);
    const total = (id: string) => a.totales.find((t) => t.mensual === id)?.centavos;
    expect(total('ing_mes')).toBe(12_000_000);
    expect(total('ded_mes')).toBe(3_000_600);
    expect(total('isr_ret_mes')).toBe(120_000);
    expect(total('isr_pagado_mes')).toBe(360_300);
    expect(a.mesesCapturados).toHaveLength(12);
    expect(a.mesesFaltantes).toEqual([]);
  });

  it('suma en centavos enteros: sin errores de redondeo decimal', () => {
    const registros = ['0.10', '0.20', '0.30'].map((v, i) => mes(`2026-0${i + 1}`, { ing_mes: v }));
    expect(acumularEjercicio('2026', registros, AHORA).totales[0].centavos).toBe(60);
  });

  it('acepta montos escritos como "$1,234.50"', () => {
    const a = acumularEjercicio('2026', [mes('2026-01', { ing_mes: '$1,234.50' }), mes('2026-02', { ing_mes: '765.50' })], AHORA);
    expect(a.totales[0].centavos).toBe(200_000);
  });

  it('solo cuenta los meses del ejercicio pedido (ignora otros años y periodos mal formados)', () => {
    const a = acumularEjercicio(
      '2026',
      [mes('2025-12', { ing_mes: '999' }), mes('2026-03', { ing_mes: '100' }), mes('2027-01', { ing_mes: '5' }), mes('2026-13', { ing_mes: '7' }), mes('2026-3', { ing_mes: '7' })],
      AHORA,
    );
    expect(a.mesesCapturados).toEqual(['2026-03']);
    expect(a.totales[0].centavos).toBe(10_000);
  });

  it('ignora montos invalidos y vacios en vez de romper', () => {
    const a = acumularEjercicio('2026', [mes('2026-01', { ing_mes: 'abc', ded_mes: '', isr_ret_mes: '50' })], AHORA);
    expect(a.totales.map((t) => t.mensual)).toEqual(['isr_ret_mes']);
  });

  it('un mes con 0.00 cuenta como capturado (la persona declaro en ceros)', () => {
    const a = acumularEjercicio('2026', [mes('2026-01', { ing_mes: '0.00' })], AHORA);
    expect(a.mesesCapturados).toEqual(['2026-01']);
    expect(a.totales[0]).toMatchObject({ mensual: 'ing_mes', centavos: 0, meses: 1 });
  });

  it('un mes solo con IVA o pagos anteriores cuenta como capturado, aunque no sume a la anual', () => {
    const a = acumularEjercicio('2026', [mes('2026-05', { iva_cobrado: '160', pagos_ant: '500' })], AHORA);
    expect(a.mesesCapturados).toEqual(['2026-05']);
    expect(a.totales).toEqual([]);
  });

  it('un mes sin ningun dato no cuenta como capturado', () => {
    expect(acumularEjercicio('2026', [mes('2026-01', {})], AHORA).mesesCapturados).toEqual([]);
  });

  it('si el mismo mes viene dos veces, gana el ultimo (no se suma doble)', () => {
    const a = acumularEjercicio('2026', [mes('2026-01', { ing_mes: '100' }), mes('2026-01', { ing_mes: '300' })], AHORA);
    expect(a.totales[0].centavos).toBe(30_000);
  });

  it('cuenta en cuantos meses se capturo cada concepto', () => {
    const a = acumularEjercicio('2026', [mes('2026-01', { ing_mes: '1', ded_mes: '1' }), mes('2026-02', { ing_mes: '1' })], AHORA);
    expect(a.totales.find((t) => t.mensual === 'ing_mes')?.meses).toBe(2);
    expect(a.totales.find((t) => t.mensual === 'ded_mes')?.meses).toBe(1);
  });

  it('sin registros no hay totales ni meses capturados', () => {
    const a = acumularEjercicio('2026', [], AHORA);
    expect(a.totales).toEqual([]);
    expect(a.mesesCapturados).toEqual([]);
    expect(a.mesesFaltantes).toHaveLength(12);
  });
});

describe('meses faltantes', () => {
  it('ejercicio ya terminado: se esperan los 12 meses', () => {
    expect(mesesEsperados('2026', AHORA)).toHaveLength(12);
    expect(mesesEsperados('2026', AHORA)[0]).toBe('2026-01');
    expect(mesesEsperados('2026', AHORA)[11]).toBe('2026-12');
  });
  it('año en curso: solo los meses ya terminados (el mes actual todavia no se declara)', () => {
    expect(mesesEsperados('2026', new Date(2026, 10, 21))).toHaveLength(10); // noviembre: enero a octubre
    expect(mesesEsperados('2026', new Date(2026, 0, 5))).toEqual([]); // enero: ninguno
  });
  it('año futuro: ninguno', () => {
    expect(mesesEsperados('2030', AHORA)).toEqual([]);
  });
  it('lista los que faltan', () => {
    const a = acumularEjercicio('2026', ['01', '02', '04'].map((m) => mes(`2026-${m}`, { ing_mes: '1' })), new Date(2026, 5, 15)); // junio
    expect(a.mesesFaltantes).toEqual(['2026-03', '2026-05']);
  });
});

describe('valoresSugeridos y aplicarSugeridos', () => {
  const acumulado = acumularEjercicio(
    '2026',
    [mes('2026-01', { ing_mes: '10000', isr_pagado_mes: '300.50' }), mes('2026-02', { ing_mes: '5000.25', isr_pagado_mes: '100' })],
    AHORA,
  );

  it('llena los campos de la anual con la suma, en la forma que se copia al portal', () => {
    expect(valoresSugeridos(acumulado)).toEqual({ ing_honorarios: '15000.25', pagos_provisionales: '400.50' });
  });

  it('no sugiere los conceptos que nunca se capturaron', () => {
    const v = valoresSugeridos(acumulado);
    expect('ded_autorizadas' in v).toBe(false);
    expect('ing_arrendamiento' in v).toBe(false);
  });

  it('los valores sugeridos pasan la validacion de la anual', () => {
    const anual = sanearValores('anual', { ...valoresSugeridos(acumulado) });
    expect(anual.ing_honorarios).toBe('15000.25');
    expect(filasParaCopiar('anual', anual).map((f) => f.copiar)).toEqual(['15000.25', '400.50']);
  });

  it('modo "vacios" respeta lo que la persona ya escribio o ajusto', () => {
    const actuales: Valores = { ...valoresVacios('anual'), ing_honorarios: '16000' };
    const r = aplicarSugeridos(actuales, valoresSugeridos(acumulado), 'vacios');
    expect(r.valores.ing_honorarios).toBe('16000');
    expect(r.valores.pagos_provisionales).toBe('400.50');
    expect(r.cambiados).toEqual(['pagos_provisionales']);
  });

  it('modo "todos" reemplaza tambien lo escrito', () => {
    const actuales: Valores = { ...valoresVacios('anual'), ing_honorarios: '16000' };
    const r = aplicarSugeridos(actuales, valoresSugeridos(acumulado), 'todos');
    expect(r.valores.ing_honorarios).toBe('15000.25');
    expect(r.cambiados.sort()).toEqual(['ing_honorarios', 'pagos_provisionales']);
  });

  it('no toca los campos que no tienen que ver con las mensuales', () => {
    const actuales: Valores = { ...valoresVacios('anual'), ded_medicos: '800', ing_salarios: '90000' };
    const r = aplicarSugeridos(actuales, valoresSugeridos(acumulado), 'todos');
    expect(r.valores.ded_medicos).toBe('800');
    expect(r.valores.ing_salarios).toBe('90000');
  });

  it('un campo que ya tiene el mismo valor no cuenta como cambiado', () => {
    const actuales: Valores = { ...valoresVacios('anual'), ing_honorarios: '15000.25' };
    expect(aplicarSugeridos(actuales, valoresSugeridos(acumulado), 'todos').cambiados).toEqual(['pagos_provisionales']);
  });

  it('no modifica el objeto original', () => {
    const actuales: Valores = { ...valoresVacios('anual') };
    aplicarSugeridos(actuales, valoresSugeridos(acumulado), 'todos');
    expect(actuales.ing_honorarios).toBe('');
  });
});

describe('ajustesDe: lo que la persona cambio respecto de la suma', () => {
  const acumulado = acumularEjercicio('2026', [mes('2026-01', { ing_mes: '10000', ded_mes: '2000' })], AHORA);

  it('sin nada escrito: no hay ajuste', () => {
    const a = ajustesDe(acumulado, valoresVacios('anual'));
    expect(a.map((x) => [x.anual, x.escrito, x.ajuste])).toEqual([
      ['ing_honorarios', null, null],
      ['ded_autorizadas', null, null],
    ]);
  });

  it('igual a la suma: ajuste cero', () => {
    const a = ajustesDe(acumulado, { ing_honorarios: '10000' });
    expect(a[0]).toMatchObject({ escrito: 1_000_000, ajuste: 0 });
  });

  it('mayor o menor que la suma: ajuste con signo', () => {
    const a = ajustesDe(acumulado, { ing_honorarios: '10500.50', ded_autorizadas: '1500' });
    expect(a[0].ajuste).toBe(50_050);
    expect(a[1].ajuste).toBe(-50_000);
  });

  it('un monto invalido escrito se trata como vacio', () => {
    expect(ajustesDe(acumulado, { ing_honorarios: 'abc' })[0].escrito).toBeNull();
  });

  it('describirAjuste', () => {
    expect(describirAjuste(50_050)).toBe('+$500.50');
    expect(describirAjuste(-120_000)).toBe('-$1,200.00');
    expect(describirAjuste(0)).toBe('$0.00');
  });
});

describe('combinarMensuales (telefono + cuenta)', () => {
  const r = (periodo: string, ing: string): RegistroMensual => mes(periodo, { ing_mes: ing });

  it('manda el telefono (puede tener cambios sin enviar) y la cuenta completa lo que falta', () => {
    const combinado = combinarMensuales([r('2026-02', '200')], [r('2026-01', '100'), r('2026-02', '999')]);
    expect(combinado.map((x) => [x.periodo, x.valores.ing_mes])).toEqual([
      ['2026-01', '100'],
      ['2026-02', '200'],
    ]);
  });

  it('sin conexion (cuenta vacia) usa lo del telefono', () => {
    expect(combinarMensuales([r('2026-03', '5')], []).map((x) => x.periodo)).toEqual(['2026-03']);
  });

  it('con telefono vacio (app reinstalada) usa lo de la cuenta, ordenado', () => {
    expect(combinarMensuales([], [r('2026-05', '1'), r('2026-01', '1')]).map((x) => x.periodo)).toEqual(['2026-01', '2026-05']);
  });
});

describe('listaDeMeses', () => {
  it('redacta la lista de forma natural', () => {
    expect(listaDeMeses([])).toBe('');
    expect(listaDeMeses(['2026-01'])).toBe('enero');
    expect(listaDeMeses(['2026-01', '2026-02'])).toBe('enero y febrero');
    expect(listaDeMeses(['2026-01', '2026-02', '2026-04'])).toBe('enero, febrero y abril');
  });
});
