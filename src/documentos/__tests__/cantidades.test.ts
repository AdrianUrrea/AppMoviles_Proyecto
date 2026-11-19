import { describe, expect, it } from 'vitest';
import { aRenglones, contarPorTipo, extraerCantidades, filasDeCantidades } from '../cantidades';

const montos = (texto: string[]) => extraerCantidades(texto).filter((c) => c.tipo === 'monto');
const resumen = (texto: string[]) => montos(texto).map((c) => [c.etiqueta, c.original]);

describe('aRenglones', () => {
  it('parte los bloques de Android (con saltos de linea) y quita vacios y espacios de mas', () => {
    expect(aRenglones(['Sueldos\n  $ 1,000.00 ', '', 'ISR\r\n$ 50.00'])).toEqual(['Sueldos', '$ 1,000.00', 'ISR', '$ 50.00']);
  });
});

describe('que cuenta como cantidad', () => {
  // Una muestra por vez: dos renglones iguales sin etiqueta se consideran el mismo dato y se juntan.
  const centavosDe = (muestra: string) => montos([muestra]).map((c) => c.centavos);

  it('reconoce los formatos habituales de dinero', () => {
    const casos: [string, number][] = [
      ['$1,234.50', 123450],
      ['$ 1,234.50', 123450],
      ['1,234.50', 123450],
      ['1234.50', 123450],
      ['$1234', 123400],
      ['1,234', 123400],
      ['$0.99', 99],
      ['$12.5', 1250],
    ];
    for (const [muestra, esperado] of casos) expect(centavosDe(muestra), muestra).toEqual([esperado]);
  });

  it('tolera puntuacion pegada y sufijos de moneda', () => {
    for (const muestra of ['Total: $1,234.50.', '(1,234.50)', '$1,234.50;', '1,234.50MXN', '1,234.50 M.N.', '"1,234.50"']) {
      expect(centavosDe(muestra), muestra).toEqual([123450]);
    }
  });

  it('NO confunde con montos: fechas, horas, RFC, CURP, CLABE, UUID, porcentajes, telefonos, folios, negativos', () => {
    const basura = [
      '31/01/2026',
      '2026-01-31',
      '10:30',
      'RFC: XAXX010101000',
      'CURP XEXX010101HNEXXXA4',
      'CLABE 012180001234567897',
      '3f2a9c1e-1111-4222-8333-444455556666',
      'IVA 16%',
      'Tel 5512345678',
      'Folio 0012345',
      '-1,234.50',
      '12,345.678',
      'A1,234.50',
    ];
    expect(extraerCantidades(basura).filter((c) => c.tipo === 'monto')).toEqual([]);
    expect(extraerCantidades(basura).filter((c) => c.tipo === 'otro')).toEqual([]);
  });

  it('enteros sueltos y un decimal van aparte como "otros" (no son montos)', () => {
    const r = extraerCantidades(['Ejercicio fiscal 2025', 'Codigo postal 22800', 'Factor 12.5']);
    expect(r.map((c) => [c.tipo, c.original, c.etiqueta])).toEqual([
      ['otro', '2025', 'Ejercicio fiscal'],
      ['otro', '22800', 'Codigo postal'],
      ['otro', '12.5', 'Factor'],
    ]);
  });

  it('rechaza cantidades enormes', () => {
    expect(montos(['$9,999,999,999.99'])).toEqual([]);
  });
});

describe('etiquetas', () => {
  it('la etiqueta es el texto que antecede en el mismo renglon', () => {
    expect(resumen(['Sueldos y salarios $ 345,678.90', 'ISR retenido: 41,234.50'])).toEqual([
      ['Sueldos y salarios', '345,678.90'],
      ['ISR retenido', '41,234.50'],
    ]);
  });

  it('iOS: etiqueta en un renglon y monto en el siguiente', () => {
    expect(resumen(['Sueldos y salarios', '$ 345,678.90', 'ISR retenido', '$ 41,234.50'])).toEqual([
      ['Sueldos y salarios', '345,678.90'],
      ['ISR retenido', '41,234.50'],
    ]);
  });

  it('encabezados antes de la etiqueta no estorban', () => {
    const t = ['CONSTANCIA DE SUELDOS', 'Fecha de emision 31/01/2026', 'RFC: XAXX010101000', 'Sueldos y salarios', '$ 1,000.00'];
    expect(resumen(t)).toEqual([['Sueldos y salarios', '1,000.00']]);
  });

  it('fila con varias columnas: las siguientes usan la etiqueta del primero y se numeran', () => {
    const r = montos(['Sueldos 10,000.00 1,500.00 8,500.00']);
    expect(r.map((c) => [c.etiqueta, c.columna, c.centavos])).toEqual([
      ['Sueldos', 1, 1000000],
      ['Sueldos', 2, 150000],
      ['Sueldos', 3, 850000],
    ]);
  });

  it('un numero de clave antes de la etiqueta no la daña ni cuenta como columna', () => {
    const r = montos(['1 Sueldos 12,345.00']);
    expect(r.map((c) => [c.etiqueta, c.columna])).toEqual([['Sueldos', 1]]);
  });

  it('columna de nombres junto a columna de montos (Android): NO inventa etiquetas', () => {
    const r = montos(['Sueldos\nISR retenido\nTotal', '10,000.00\n1,500.00\n11,500.00']);
    expect(r.map((c) => c.etiqueta)).toEqual(['', '', '']);
    expect(r.map((c) => c.centavos)).toEqual([1000000, 150000, 1150000]);
  });

  it('bloques de Android con etiqueta y monto juntos', () => {
    expect(resumen(['Sueldos y salarios\n$ 345,678.90', 'ISR retenido\n$ 41,234.50'])).toEqual([
      ['Sueldos y salarios', '345,678.90'],
      ['ISR retenido', '41,234.50'],
    ]);
  });

  it('etiquetas largas se acortan', () => {
    const larga = 'Honorarios por servicios profesionales independientes prestados durante todo el ejercicio fiscal';
    expect(montos([`${larga} 1,000.00`])[0].etiqueta.length).toBeLessThanOrEqual(60);
  });
});

describe('duplicados y orden', () => {
  it('el mismo monto con la misma etiqueta aparece una sola vez; con otra etiqueta, se conserva', () => {
    const r = resumen(['Total 5,000.00', 'Total 5,000.00', 'Subtotal 5,000.00']);
    expect(r).toEqual([
      ['Total', '5,000.00'],
      ['Subtotal', '5,000.00'],
    ]);
  });
  it('respeta el orden del documento', () => {
    expect(montos(['A 3.00', 'B 1.00', 'C 2.00']).map((c) => c.centavos)).toEqual([300, 100, 200]);
  });
  it('sin texto o sin numeros -> lista vacia', () => {
    expect(extraerCantidades([])).toEqual([]);
    expect(extraerCantidades(['Hola', 'mundo'])).toEqual([]);
  });
});

describe('documento completo (ejemplo tipo constancia de sueldos)', () => {
  const ios = [
    'CONSTANCIA DE SUELDOS, SALARIOS, CONCEPTOS ASIMILADOS',
    'Ejercicio fiscal 2025',
    'RFC del trabajador: XAXX010101000',
    'CURP: XEXX010101HNEXXXA4',
    'Fecha de emision 31/01/2026',
    'Sueldos y salarios',
    '$ 345,678.90',
    'ISR retenido',
    '$ 41,234.50',
    'Total de percepciones $ 350,000.00',
    'Folio 0012345',
    'IVA 16%',
  ];
  it('separa solo los montos, con su etiqueta', () => {
    expect(resumen(ios)).toEqual([
      ['Sueldos y salarios', '345,678.90'],
      ['ISR retenido', '41,234.50'],
      ['Total de percepciones', '350,000.00'],
    ]);
  });
  it('lo demas (2025) queda como "otro"', () => {
    expect(contarPorTipo(extraerCantidades(ios))).toEqual({ montos: 3, otros: 1 });
  });
});

describe('filasDeCantidades', () => {
  const lista = extraerCantidades(['Sueldos 10,000.00 1,500.00', 'Ejercicio 2025']);

  it('los montos se copian listos para pegar (sin $ ni comas) y se muestran con formato', () => {
    const f = filasDeCantidades(lista, false);
    expect(f.map((x) => [x.etiqueta, x.copiar, x.mostrar])).toEqual([
      ['Sueldos', '10000', '$10,000.00'],
      ['Sueldos · columna 2', '1500', '$1,500.00'],
    ]);
  });
  it('los "otros" solo salen si se piden, tal cual se leyeron (sin formato de dinero)', () => {
    expect(filasDeCantidades(lista, false).some((x) => x.mostrar === '2025')).toBe(false);
    const f = filasDeCantidades(lista, true).filter((x) => x.seccion !== 'Cantidades encontradas');
    expect(f.map((x) => [x.copiar, x.mostrar])).toEqual([['2025', '2025']]);
  });
  it('cantidad sin etiqueta se nombra "Sin etiqueta" y los ids son unicos', () => {
    const f = filasDeCantidades(extraerCantidades(['$5.00', '$6.00']), false);
    expect(f.every((x) => x.etiqueta === 'Sin etiqueta')).toBe(true);
    expect(new Set(f.map((x) => x.id)).size).toBe(f.length);
  });
});
