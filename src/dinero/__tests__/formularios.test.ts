import { describe, expect, it } from 'vitest';
import { crearEsquemaDinero } from '../esquema';
import {
  CLAVE_VALIDA,
  FORMULARIOS,
  camposDe,
  claveDe,
  esTipoDato,
  etiquetaPeriodo,
  filasParaCopiar,
  periodosDisponibles,
  sanearValores,
  totales,
  valoresVacios,
} from '../formularios';
import type { TipoDato } from '../formularios';

const TIPOS: TipoDato[] = ['anual', 'mensual', 'cuenta'];

describe('integridad de los formularios', () => {
  it('hay un formulario por tipo, con secciones y campos', () => {
    for (const t of TIPOS) {
      expect(FORMULARIOS[t].tipo).toBe(t);
      expect(FORMULARIOS[t].secciones.length).toBeGreaterThan(0);
      expect(camposDe(t).length).toBeGreaterThan(0);
    }
  });
  it('los ids de campo son unicos dentro de un formulario', () => {
    for (const t of TIPOS) {
      const ids = camposDe(t).map((c) => c.id);
      expect(new Set(ids).size, t).toBe(ids.length);
    }
  });
  it('los totales solo suman campos que existen', () => {
    for (const t of TIPOS) {
      const ids = new Set(camposDe(t).map((c) => c.id));
      for (const total of FORMULARIOS[t].totales) {
        for (const id of [...total.suma, ...(total.resta ?? [])]) expect(ids.has(id), `${t}:${total.id}:${id}`).toBe(true);
      }
    }
  });
  it('la declaracion anual incluye los 9 conceptos de deducciones personales', () => {
    const ded = FORMULARIOS.anual.secciones.find((s) => s.id === 'deducciones');
    expect(ded?.campos).toHaveLength(9);
  });
  it('el orden es ingresos -> retenciones -> deducciones', () => {
    expect(FORMULARIOS.anual.secciones.map((s) => s.id)).toEqual(['ingresos', 'retenciones', 'deducciones']);
  });
  it('la CLABE es obligatoria en el formulario de cuenta', () => {
    expect(camposDe('cuenta').find((c) => c.id === 'clabe')?.obligatorio).toBe(true);
  });
});

describe('claves y periodos', () => {
  it('claveDe genera claves aceptadas por la base de datos', () => {
    expect(claveDe('anual', '2025')).toBe('anual-2025');
    expect(claveDe('mensual', '2026-10')).toBe('mensual-2026-10');
    expect(claveDe('cuenta', 'lo-que-sea')).toBe('cuenta');
    for (const c of ['anual-2025', 'mensual-2026-10', 'mensual-2026-01', 'mensual-2026-12', 'cuenta']) {
      expect(CLAVE_VALIDA.test(c), c).toBe(true);
    }
  });
  it('rechaza claves invalidas', () => {
    for (const c of ['anual-25', 'mensual-2026-13', 'mensual-2026-00', 'otra', 'cuenta-1', '', 'anual-2025 ', "anual-2025'; drop"]) {
      expect(CLAVE_VALIDA.test(c), c).toBe(false);
    }
  });
  it('periodos del anual: los 5 ejercicios anteriores', () => {
    expect(periodosDisponibles('anual', new Date(2026, 10, 14))).toEqual(['2025', '2024', '2023', '2022', '2021']);
  });
  it('periodos del mensual: 12 meses, cruzando el cambio de año', () => {
    const p = periodosDisponibles('mensual', new Date(2026, 1, 10));
    expect(p).toHaveLength(12);
    expect(p[0]).toBe('2026-02');
    expect(p[1]).toBe('2026-01');
    expect(p[2]).toBe('2025-12');
    expect(p[11]).toBe('2025-03');
    for (const periodo of p) expect(CLAVE_VALIDA.test(claveDe('mensual', periodo))).toBe(true);
  });
  it('cuenta no tiene periodos', () => {
    expect(periodosDisponibles('cuenta', new Date())).toEqual([]);
  });
  it('etiquetas legibles', () => {
    expect(etiquetaPeriodo('anual', '2025')).toBe('Ejercicio 2025');
    expect(etiquetaPeriodo('mensual', '2026-10')).toBe('Octubre 2026');
  });
  it('esTipoDato', () => {
    expect(esTipoDato('anual')).toBe(true);
    expect(esTipoDato('otro')).toBe(false);
    expect(esTipoDato(undefined)).toBe(false);
  });
});

describe('sanearValores (datos de la base pueden venir mal formados)', () => {
  it('descarta campos desconocidos, tipos incorrectos y montos invalidos', () => {
    const v = sanearValores('anual', { ing_salarios: '1000', ing_otros: 5, ded_donativos: 'abc', intruso: 'x' });
    expect(v.ing_salarios).toBe('1000');
    expect(v.ing_otros).toBe('');
    expect(v.ded_donativos).toBe('');
    expect('intruso' in v).toBe(false);
  });
  it('entradas basura devuelven valores vacios', () => {
    for (const crudo of [null, undefined, 'texto', 42, [], [1, 2]]) {
      expect(sanearValores('anual', crudo)).toEqual(valoresVacios('anual'));
    }
  });
  it('descarta una CLABE invalida', () => {
    expect(sanearValores('cuenta', { clabe: '123' }).clabe).toBe('');
    expect(sanearValores('cuenta', { clabe: '002010077777777771' }).clabe).toBe('002010077777777771');
  });
});

describe('totales', () => {
  it('suma ingresos y deducciones en centavos exactos', () => {
    const v = { ...valoresVacios('anual'), ing_salarios: '100000.10', ing_honorarios: '0.20', ded_medicos: '1500.50', ded_seguros: '3000' };
    const t = Object.fromEntries(totales('anual', v).map((x) => [x.id, x.centavos]));
    expect(t.total_ingresos).toBe(10000030);
    expect(t.total_deducciones).toBe(450050);
  });
  it('ignora campos vacios o invalidos', () => {
    const v = { ...valoresVacios('anual'), ing_salarios: 'abc', ing_otros: '5' };
    expect(totales('anual', v)[0].centavos).toBe(500);
  });
  it('la referencia mensual puede ser negativa', () => {
    const v = { ...valoresVacios('mensual'), ing_mes: '1000', ded_mes: '1500' };
    expect(totales('mensual', v).find((x) => x.id === 'referencia')?.centavos).toBe(-50000);
  });
  it('cuenta no tiene totales', () => {
    expect(totales('cuenta', valoresVacios('cuenta'))).toEqual([]);
  });
});

describe('filasParaCopiar', () => {
  it('solo incluye campos con valor, en el orden del formulario', () => {
    const v = { ...valoresVacios('anual'), ded_medicos: '2500.5', ing_salarios: '120000', isr_retenido: '9000' };
    const filas = filasParaCopiar('anual', v);
    expect(filas.map((f) => f.id)).toEqual(['ing_salarios', 'isr_retenido', 'ded_medicos']);
    expect(filas[0]).toMatchObject({ copiar: '120000', mostrar: '$120,000.00', sensible: false, seccion: 'Ingresos del ejercicio' });
    expect(filas[2].copiar).toBe('2500.50');
  });
  it('un cero explicito se conserva', () => {
    expect(filasParaCopiar('anual', { ...valoresVacios('anual'), ing_otros: '0' }).map((f) => f.copiar)).toEqual(['0']);
  });
  it('la CLABE se muestra oculta pero se copia completa', () => {
    const [fila] = filasParaCopiar('cuenta', { clabe: '002010077777777771', banco: 'Banorte' });
    expect(fila.copiar).toBe('002010077777777771');
    expect(fila.mostrar).toBe('••••••••••••••7771');
    expect(fila.sensible).toBe(true);
  });
  it('omite valores invalidos en vez de mostrarlos', () => {
    expect(filasParaCopiar('anual', { ...valoresVacios('anual'), ing_salarios: 'basura' })).toEqual([]);
  });
  it('sin datos no hay filas', () => {
    for (const t of TIPOS) expect(filasParaCopiar(t, valoresVacios(t))).toEqual([]);
  });
});

describe('esquema del formulario', () => {
  const analizar = (tipo: TipoDato, datos: Record<string, string>) => {
    const r = crearEsquemaDinero(tipo).safeParse({ ...valoresVacios(tipo), ...datos });
    if (r.success) return { ok: true as const, data: r.data, errores: {} as Record<string, string> };
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) if (!(String(i.path[0]) in errores)) errores[String(i.path[0])] = i.message;
    return { ok: false as const, data: null, errores };
  };

  it('acepta un formulario vacio (todo es opcional salvo la CLABE)', () => {
    expect(analizar('anual', {}).ok).toBe(true);
    expect(analizar('mensual', {}).ok).toBe(true);
  });
  it('normaliza $ y comas a la forma canonica', () => {
    const r = analizar('anual', { ing_salarios: '$120,000.00', ded_medicos: '2,500.50' });
    expect(r.ok && r.data.ing_salarios).toBe('120000');
    expect(r.ok && r.data.ded_medicos).toBe('2500.50');
  });
  it('marca montos invalidos por campo', () => {
    const r = analizar('anual', { ing_salarios: 'doce mil', ded_donativos: '12,5' });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errores).sort()).toEqual(['ded_donativos', 'ing_salarios']);
  });
  it('la cuenta exige la CLABE y valida su digito verificador', () => {
    expect(analizar('cuenta', {}).errores.clabe).toBe('Este campo es obligatorio.');
    expect(analizar('cuenta', { clabe: '002010077777777772' }).errores.clabe).toContain('no es válida');
    const ok = analizar('cuenta', { clabe: '0020 1007 7777 7777 71', banco: '  Banorte ' });
    expect(ok.ok && ok.data.clabe).toBe('002010077777777771');
    expect(ok.ok && ok.data.banco).toBe('Banorte');
  });
  it('limita el texto del banco', () => {
    expect(analizar('cuenta', { clabe: '002010077777777771', banco: 'x'.repeat(61) }).errores.banco).toContain('60');
  });
});
