/**
 * Declaraciones mensuales -> declaracion anual (logica pura, sin dependencias de la app).
 *
 * Lo que el usuario captura mes a mes se SUMA por ejercicio para llenar su declaracion anual: asi la anual ya trae el
 * total del año y solo se hacen ajustes. Esta app no calcula el impuesto; solo suma lo que el usuario capturo.
 *
 * Solo se suman conceptos que significan lo mismo en los dos formularios (ver CONCEPTOS_ACUMULADOS). Por ejemplo
 * "Pagos provisionales anteriores del año" NO se suma: ya es un acumulado, y sumarlo duplicaria los pagos.
 */

import { MESES } from '../recordatorios/nombres';
import { camposDe } from './formularios';
import type { Valores } from './formularios';
import { MAX_CENTAVOS, aCentavos, formatearMonto, montoParaCopiar } from './montos';

export type ConceptoAcumulado = {
  /** Campo del formulario mensual que se suma. */
  mensual: string;
  /** Campo del formulario anual que se llena con la suma. */
  anual: string;
  etiqueta: string;
};

export const CONCEPTOS_ACUMULADOS: readonly ConceptoAcumulado[] = [
  { mensual: 'ing_mes', anual: 'ing_honorarios', etiqueta: 'Ingresos por actividad profesional o empresarial' },
  { mensual: 'ing_arr_mes', anual: 'ing_arrendamiento', etiqueta: 'Ingresos por arrendamiento' },
  { mensual: 'ded_mes', anual: 'ded_autorizadas', etiqueta: 'Gastos y deducciones autorizadas' },
  { mensual: 'isr_ret_mes', anual: 'isr_retenido', etiqueta: 'ISR retenido' },
  { mensual: 'isr_pagado_mes', anual: 'pagos_provisionales', etiqueta: 'ISR pagado en tus declaraciones mensuales' },
];

export type RegistroMensual = { periodo: string; valores: Valores };

export type TotalAcumulado = ConceptoAcumulado & {
  centavos: number;
  /** En cuantos meses se capturo este concepto. */
  meses: number;
};

export type Acumulado = {
  ejercicio: string;
  /** Meses (AAAA-MM, de enero a diciembre) con al menos un monto capturado. */
  mesesCapturados: string[];
  /** Meses ya terminados del ejercicio en los que no hay nada capturado. */
  mesesFaltantes: string[];
  /** Solo los conceptos capturados en al menos un mes. */
  totales: TotalAcumulado[];
};

const PERIODO_MENSUAL = /^\d{4}-(0[1-9]|1[0-2])$/;

const tieneTexto = (v: string | undefined): v is string => (v ?? '').trim() !== '';

/** Meses del ejercicio que ya terminaron (los que ya se pudieron declarar): 12 si el año paso; enero..mes anterior si es el actual. */
export function mesesEsperados(ejercicio: string, ahora: Date): string[] {
  const anio = Number(ejercicio);
  const actual = ahora.getFullYear();
  if (!Number.isInteger(anio) || anio > actual) return [];
  const cuantos = anio < actual ? 12 : ahora.getMonth();
  return Array.from({ length: cuantos }, (_, i) => `${ejercicio}-${String(i + 1).padStart(2, '0')}`);
}

/** Suma lo capturado en los meses de un ejercicio. Ignora meses de otro año, periodos mal formados y montos invalidos. */
export function acumularEjercicio(ejercicio: string, registros: readonly RegistroMensual[], ahora: Date): Acumulado {
  const porPeriodo = new Map<string, Valores>();
  for (const r of registros) {
    if (PERIODO_MENSUAL.test(r.periodo) && r.periodo.startsWith(`${ejercicio}-`)) porPeriodo.set(r.periodo, r.valores);
  }
  const periodos = [...porPeriodo.keys()].sort();

  const camposMonto = camposDe('mensual').filter((c) => c.tipo === 'monto');
  const sumas = new Map<string, { centavos: number; meses: number }>();
  const capturados: string[] = [];

  for (const periodo of periodos) {
    const valores = porPeriodo.get(periodo) ?? {};
    if (camposMonto.some((c) => tieneTexto(valores[c.id]) && aCentavos(valores[c.id] ?? '') !== null)) capturados.push(periodo);
    for (const concepto of CONCEPTOS_ACUMULADOS) {
      const crudo = valores[concepto.mensual];
      const c = tieneTexto(crudo) ? aCentavos(crudo) : null;
      if (c === null) continue;
      const previo = sumas.get(concepto.mensual) ?? { centavos: 0, meses: 0 };
      sumas.set(concepto.mensual, { centavos: previo.centavos + c, meses: previo.meses + 1 });
    }
  }

  const totales: TotalAcumulado[] = [];
  for (const concepto of CONCEPTOS_ACUMULADOS) {
    const suma = sumas.get(concepto.mensual);
    if (suma) totales.push({ ...concepto, ...suma });
  }

  const hechos = new Set(capturados);
  return {
    ejercicio,
    mesesCapturados: capturados,
    mesesFaltantes: mesesEsperados(ejercicio, ahora).filter((m) => !hechos.has(m)),
    totales,
  };
}

/** Valores del formulario ANUAL que salen de la suma (solo los capturados y que caben en un monto valido). */
export function valoresSugeridos(acumulado: Acumulado): Valores {
  const salida: Valores = {};
  for (const t of acumulado.totales) if (t.centavos <= MAX_CENTAVOS) salida[t.anual] = montoParaCopiar(t.centavos);
  return salida;
}

/**
 * Aplica los valores sugeridos a los de la anual.
 *  - 'vacios': solo llena los campos que estan vacios (respeta lo que el usuario ya escribio o ajusto).
 *  - 'todos':  reemplaza tambien lo escrito en esos campos.
 * Devuelve los valores nuevos y los ids que cambiaron.
 */
export function aplicarSugeridos(
  actuales: Valores,
  sugeridos: Valores,
  modo: 'vacios' | 'todos',
): { valores: Valores; cambiados: string[] } {
  const valores = { ...actuales };
  const cambiados: string[] = [];
  for (const [id, sugerido] of Object.entries(sugeridos)) {
    const actual = actuales[id] ?? '';
    if (modo === 'vacios' && tieneTexto(actual)) continue;
    if (actual.trim() === sugerido) continue;
    valores[id] = sugerido;
    cambiados.push(id);
  }
  return { valores, cambiados };
}

export type Ajuste = {
  anual: string;
  etiqueta: string;
  /** Lo que suman las declaraciones mensuales. */
  mensual: number;
  /** Lo que hay escrito en la anual; null si esta vacio o no es un monto valido. */
  escrito: number | null;
  /** escrito - mensual; null si no hay nada escrito. 0 = igual a la suma. */
  ajuste: number | null;
};

/** Compara, concepto por concepto, la suma de las mensuales con lo que hay en la anual. */
export function ajustesDe(acumulado: Acumulado, actuales: Partial<Valores>): Ajuste[] {
  return acumulado.totales.map((t) => {
    const crudo = actuales[t.anual];
    const escrito = tieneTexto(crudo) ? aCentavos(crudo) : null;
    return {
      anual: t.anual,
      etiqueta: t.etiqueta,
      mensual: t.centavos,
      escrito,
      ajuste: escrito === null ? null : escrito - t.centavos,
    };
  });
}

/** "+$5,000.00", "-$1,200.00", "$0.00". */
export function describirAjuste(centavos: number): string {
  if (centavos === 0) return formatearMonto(0);
  return `${centavos > 0 ? '+' : '-'}${formatearMonto(Math.abs(centavos))}`;
}

/**
 * Une lo que hay en el telefono con lo que hay en la cuenta: por cada mes manda el telefono (puede tener cambios aun
 * sin enviar) y la cuenta completa los meses que el telefono no tiene (por ejemplo, tras instalar la app de nuevo).
 */
export function combinarMensuales(locales: readonly RegistroMensual[], remotos: readonly RegistroMensual[]): RegistroMensual[] {
  const porPeriodo = new Map<string, RegistroMensual>();
  for (const r of remotos) porPeriodo.set(r.periodo, r);
  for (const r of locales) porPeriodo.set(r.periodo, r);
  return [...porPeriodo.values()].sort((a, b) => a.periodo.localeCompare(b.periodo));
}

/** ["2026-01", "2026-02", "2026-04"] -> "enero, febrero y abril". */
export function listaDeMeses(periodos: readonly string[]): string {
  const nombres = periodos.map((p) => MESES[Number(p.slice(5, 7)) - 1] ?? p);
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}
