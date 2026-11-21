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

  it('columna de nombres junto a columna de montos (Android): se emparejan en orden y se avisa', () => {
    const r = montos(['Sueldos\nISR retenido\nTotal', '10,000.00\n1,500.00\n11,500.00']);
    expect(r.map((c) => c.etiqueta)).toEqual(['Sueldos', 'ISR retenido', 'Total']);
    expect(r.map((c) => c.centavos)).toEqual([1000000, 150000, 1150000]);
    expect(r.every((c) => c.avisos.some((a) => a.includes('orden del texto')))).toBe(true);
  });

  it('si hay menos nombres que cantidades NO se adivina: quedan sin etiqueta', () => {
    const r = montos(['Sueldos\nISR retenido', '10,000.00\n1,500.00\n11,500.00']);
    expect(r.map((c) => c.etiqueta)).toEqual(['', '', '']);
    expect(r.every((c) => c.avisos.length === 0)).toBe(true);
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
  it('la fecha de emision se detecta con su etiqueta', () => {
    const f = extraerCantidades(ios).filter((c) => c.tipo === 'fecha');
    expect(f.map((c) => [c.etiqueta, c.iso])).toEqual([['Fecha de emision', '2026-01-31']]);
  });
  it('lo demas (2025) queda como "otro"', () => {
    expect(contarPorTipo(extraerCantidades(ios))).toEqual({ montos: 3, fechas: 1, otros: 1 });
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
    const f = filasDeCantidades(lista, true).filter((x) => x.seccion.startsWith('Otros'));
    expect(f.map((x) => [x.copiar, x.mostrar])).toEqual([['2025', '2025']]);
  });
  it('cantidad sin etiqueta se nombra "Sin etiqueta" y los ids son unicos', () => {
    const f = filasDeCantidades(extraerCantidades(['$5.00', '$6.00']), false);
    expect(f.every((x) => x.etiqueta === 'Sin etiqueta')).toBe(true);
    expect(new Set(f.map((x) => x.id)).size).toBe(f.length);
  });
});

const extraer = (texto: string[]) => extraerCantidades(texto);
const fechas = (texto: string[]) => extraer(texto).filter((c) => c.tipo === 'fecha');
const isos = (muestra: string) => fechas([muestra]).map((c) => c.iso);

describe('fechas', () => {
  it('reconoce fechas numericas (dia/mes/anio, el orden de Mexico)', () => {
    const casos: [string, string][] = [
      ['31/01/2026', '2026-01-31'],
      ['31-01-2026', '2026-01-31'],
      ['31.01.2026', '2026-01-31'],
      ['5/3/2026', '2026-03-05'],
      ['05/03/2026', '2026-03-05'], // ambigua: se asume dia/mes
      ['2026-01-31', '2026-01-31'],
      ['2026/01/31', '2026-01-31'],
      ['31/01/26', '2026-01-31'],
      ['05/03/90', '1990-03-05'],
      ['01/31/2026', '2026-01-31'], // mes/dia solo cuando es la unica lectura posible
    ];
    for (const [muestra, esperado] of casos) expect(isos(muestra), muestra).toEqual([esperado]);
  });

  it('reconoce fechas con el mes escrito, completo o abreviado, con o sin acentos y en mayusculas', () => {
    const casos: [string, string][] = [
      ['31 de enero de 2026', '2026-01-31'],
      ['31 DE ENERO DE 2026', '2026-01-31'],
      ['1 de septiembre de 2025', '2025-09-01'],
      ['7 de mayo del 2024', '2024-05-07'],
      ['31 ene 2026', '2026-01-31'],
      ['3 sept 2025', '2025-09-03'],
      ['15-ENE-2027', '2027-01-15'],
      ['15/ene/27', '2027-01-15'],
      ['2 de diciembre, 2025', '2025-12-02'],
    ];
    for (const [muestra, esperado] of casos) expect(isos(muestra), muestra).toEqual([esperado]);
  });

  it('una fecha con anio de dos digitos lleva aviso con el anio que se asumio', () => {
    const [f] = fechas(['05/03/90']);
    expect(f.avisos.join(' ')).toContain('1990');
    expect(fechas(['05/03/1990'])[0].avisos).toEqual([]);
  });

  it('NO son fechas: dias o meses que no existen, folios, UUID, horas, o sin anio', () => {
    const basura = [
      '31/02/2026',
      '32/01/2026',
      '2026-13-01',
      '1.2.25',
      'Folio 12-05-2025123',
      '3f2a9c1e-1111-4222-8333-444455556666',
      '10:30',
      '31 de enero',
      'enero 2026',
      '31/01/1850',
      'Av. 20 DE NOVIEMBRE 1910', // nombre de calle
      'Calle 5 DE MAYO 123',
    ];
    for (const muestra of basura) expect(isos(muestra), muestra).toEqual([]);
  });

  it('las cifras de una fecha no se cuentan tambien como otros numeros ni como montos', () => {
    const r = extraer(['Fecha de emision 31 de enero de 2026']);
    expect(r.map((c) => c.tipo)).toEqual(['fecha']);
  });

  it('etiqueta: el texto del renglon, o el renglon de arriba si va sola', () => {
    expect(fechas(['Fecha de emision 31/01/2026']).map((c) => c.etiqueta)).toEqual(['Fecha de emision']);
    expect(fechas(['Fecha de emision', '31/01/2026']).map((c) => c.etiqueta)).toEqual(['Fecha de emision']);
  });

  it('un rango "del ... al ..." da dos fechas con la misma etiqueta: inicio y fin', () => {
    const r = fechas(['Periodo del 01/01/2025 al 31/12/2025']);
    expect(r.map((c) => [c.etiqueta, c.columnaNombre, c.iso])).toEqual([
      ['Periodo', 'inicio', '2025-01-01'],
      ['Periodo', 'fin', '2025-12-31'],
    ]);
  });

  it('una fecha y un monto en el mismo renglon conservan cada uno su etiqueta', () => {
    const r = extraer(['Fecha 31/01/2026 Total 1,000.00']);
    expect(r.map((c) => [c.tipo, c.etiqueta])).toEqual([
      ['fecha', 'Fecha'],
      ['monto', 'Total'],
    ]);
  });
});

describe('montos que antes se perdian o salian mal', () => {
  const centavosDe = (muestra: string) => montos([muestra]).map((c) => c.centavos);

  it('coma decimal y formato europeo', () => {
    for (const muestra of ['1.234,50', '1234,50', '$1,234,50', 'Total 1.234,50']) {
      expect(centavosDe(muestra), muestra).toEqual([123450]);
    }
    expect(centavosDe('12,50')).toEqual([1250]);
  });

  it('el OCR confunde S por $ y la letra O por cero', () => {
    expect(centavosDe('Total S1,234.50')).toEqual([123450]);
    const [m] = montos(['ISR 1,2O0.00']);
    expect(m.centavos).toBe(120000);
    expect(m.avisos.join(' ')).toContain('letras');
  });

  it('miles separados por espacio se unen (antes salia solo "234.50") y se avisa', () => {
    const r = montos(['Sueldos 1 234.50', 'ISR 12 345.00']);
    expect(r.map((c) => [c.etiqueta, c.centavos])).toEqual([
      ['Sueldos', 123450],
      ['ISR', 1234500],
    ]);
    expect(r.every((c) => c.avisos.join(' ').includes('espacio'))).toBe(true);
  });

  it('no junta cifras que no forman miles', () => {
    expect(montos(['Folio 12 345'])).toEqual([]);
    expect(montos(['Total 2025 345.00']).map((c) => c.centavos)).toEqual([34500]);
  });

  it('un entero junto a una etiqueta de dinero es un monto sin centavos, con aviso', () => {
    const r = montos(['Sueldos y salarios 345678', 'ISR retenido 41234', 'Total 350000']);
    expect(r.map((c) => [c.etiqueta, c.centavos])).toEqual([
      ['Sueldos y salarios', 34567800],
      ['ISR retenido', 4123400],
      ['Total', 35000000],
    ]);
    expect(r.every((c) => c.avisos.join(' ').includes('sin centavos'))).toBe(true);
  });

  it('un entero con etiqueta que NO es de dinero sigue siendo "otro"', () => {
    const r = extraer(['Ejercicio fiscal 2025', 'Codigo postal 22800', 'Folio 345678', 'Total 2025', 'Total de hijos 2']);
    expect(r.every((c) => c.tipo === 'otro')).toBe(true);
    expect(r.map((c) => c.original)).toEqual(['2025', '22800', '345678', '2025', '2']);
  });
});

describe('vinculo de cada dato con su origen', () => {
  it('guarda el renglon del que salio', () => {
    const [m] = montos(['Sueldos y salarios $ 345,678.90']);
    expect(m.fuente).toBe('Sueldos y salarios $ 345,678.90');
  });

  it('si la etiqueta estaba arriba, la fuente muestra los dos renglones', () => {
    const [m] = montos(['Sueldos y salarios', '$ 345,678.90']);
    expect(m.fuente).toBe('Sueldos y salarios / $ 345,678.90');
    expect(m.avisos).toEqual([]); // un solo dato bajo un solo nombre: vinculo directo
  });

  it('el monto antes de la etiqueta toma la etiqueta que le sigue', () => {
    expect(resumen(['$ 1,000.00 Sueldos', '$ 500.00 ISR retenido'])).toEqual([
      ['Sueldos', '1,000.00'],
      ['ISR retenido', '500.00'],
    ]);
  });

  it('una etiqueta partida en dos renglones se junta', () => {
    expect(resumen(['Sueldos y salarios', 'del ejercicio', '$ 1,000.00'])).toEqual([['Sueldos y salarios del ejercicio', '1,000.00']]);
  });

  it('palabras de moneda no cuentan como etiqueta ni se quedan pegadas', () => {
    expect(resumen(['Total MXN 5,000.00', '1,234.50 M.N.'])).toEqual([
      ['Total', '5,000.00'],
      ['', '1,234.50'],
    ]);
  });

  it('tabla con encabezado: cada columna lleva su nombre', () => {
    const t = ['Concepto Importe Retencion', 'Sueldos 10,000.00 1,500.00', 'Aguinaldo 2,000.00 0.00'];
    expect(montos(t).map((c) => [c.etiqueta, c.columnaNombre, c.centavos])).toEqual([
      ['Sueldos', 'Importe', 1000000],
      ['Sueldos', 'Retencion', 150000],
      ['Aguinaldo', 'Importe', 200000],
      ['Aguinaldo', 'Retencion', 0],
    ]);
    expect(filasDeCantidades(extraer(t), false).map((f) => f.etiqueta)).toEqual([
      'Sueldos · Importe',
      'Sueldos · Retencion',
      'Aguinaldo · Importe',
      'Aguinaldo · Retencion',
    ]);
  });

  it('si el encabezado no cuadra con las columnas, no se usa y quedan "columna N"', () => {
    const t = ['Concepto Importe Base gravable Retencion', 'Sueldos 10,000.00 1,500.00'];
    expect(filasDeCantidades(extraer(t), false).map((f) => f.etiqueta)).toEqual(['Sueldos', 'Sueldos · columna 2']);
  });
});

describe('filasDeCantidades con fechas, origen y avisos', () => {
  const doc = ['Sueldos 10,000.00', 'Fecha de emision 31 de enero de 2026', 'Ejercicio fiscal 2025'];

  it('van primero los montos, luego las fechas y al final (si se piden) los otros', () => {
    const f = filasDeCantidades(extraer(doc), true);
    expect(f.map((x) => x.seccion)).toEqual(['Montos encontrados', 'Fechas encontradas', 'Otros números (revísalos)']);
    expect(filasDeCantidades(extraer(doc), false).map((x) => x.seccion)).toEqual(['Montos encontrados', 'Fechas encontradas']);
  });

  it('la fecha se copia como DD/MM/AAAA y se muestra con el mes escrito', () => {
    const f = filasDeCantidades(extraer(doc), false).find((x) => x.seccion === 'Fechas encontradas');
    expect([f?.etiqueta, f?.copiar, f?.mostrar]).toEqual(['Fecha de emision', '31/01/2026', '31 de enero de 2026']);
  });

  it('cada fila dice de que renglon salio y solo avisa cuando hubo deduccion', () => {
    const f = filasDeCantidades(extraer(doc), false);
    expect(f[0].detalle).toBe('Se leyó en: “Sueldos 10,000.00”');
    expect(f[0].aviso).toBeUndefined();
    const dudosa = filasDeCantidades(extraer(['Sueldos 345678']), false)[0];
    expect(dudosa.aviso).toContain('sin centavos');
  });

  it('los ids de las filas son unicos', () => {
    const f = filasDeCantidades(extraer(doc), true);
    expect(new Set(f.map((x) => x.id)).size).toBe(f.length);
  });
});

describe('codigos al inicio del renglon (documento con codigo contable y concepto)', () => {
  const tabla = [
    '236505 SALARIOS Y DEMAS PAGOS LABORALES',
    '23651501 HONORARIOS A LA TARIFA DEL 10%',
    '23651505 HONORARIOS A LA TARIFA DEL 11 %',
    '23652005 COMISIONES A LA TARIFA DEL 11%',
    '23653001 ARRENDAMIENTO DE BIENES INMUEBLES 3,5%',
  ];

  it('un codigo seguido de su descripcion NO es un monto, aunque la descripcion hable de dinero', () => {
    expect(montos(tabla)).toEqual([]);
  });

  it('el codigo queda como "otro" con la descripcion como etiqueta (se ve solo si se piden los otros)', () => {
    const r = extraerCantidades(tabla);
    expect(r.every((c) => c.tipo === 'otro')).toBe(true);
    expect(r.map((c) => c.original)).toEqual(['236505', '23651501', '23651505', '23652005', '23653001']);
    expect(r[0].etiqueta).toBe('SALARIOS Y DEMAS PAGOS LABORALES');
  });

  it('un porcentaje separado de su signo ("11 %") no cuenta como numero', () => {
    expect(extraerCantidades(['COMISIONES A LA TARIFA DEL 11 %'])).toEqual([]);
  });

  it('el mismo numero con la etiqueta ANTES si es un monto sin centavos', () => {
    expect(resumen(['Salarios y demas pagos laborales 236505'])).toEqual([['Salarios y demas pagos laborales', '236505']]);
  });

  it('los montos de la tabla (sin $, con comas) se siguen leyendo y no se mezclan con los codigos', () => {
    const r = montos(['23651501 HONORARIOS A LA TARIFA DEL 10%', '370,000', '40,700']);
    expect(r.map((c) => c.centavos)).toEqual([37000000, 4070000]);
  });
});

describe('emparejar columnas por posicion solo cuando cuadra', () => {
  it('muchos nombres y pocas cantidades (celdas vacias en la tabla): no se adivina', () => {
    const nombres = 'Concepto\nSueldos\nISR\nAguinaldo\nPrimas\nPremios';
    const r = montos([nombres, '1,000.00\n2,000.00']);
    expect(r.map((c) => c.etiqueta)).toEqual(['', '']);
  });

  it('un nombre de mas arriba (el encabezado de la columna) si se tolera', () => {
    const r = montos(['CONCEPTO\nSueldos\nISR retenido', '1,000.00\n2,000.00']);
    expect(r.map((c) => c.etiqueta)).toEqual(['Sueldos', 'ISR retenido']);
    expect(r.every((c) => c.avisos.length > 0)).toBe(true);
  });
});

describe('filasDeCantidades: solo montos (para elegir un documento dentro de un tramite)', () => {
  const doc = ['Sueldos 10,000.00', 'Fecha de emision 31 de enero de 2026', 'Ejercicio fiscal 2025'];

  it('con incluirFechas en false solo salen los montos', () => {
    const f = filasDeCantidades(extraer(doc), false, false);
    expect(f.map((x) => x.seccion)).toEqual(['Montos encontrados']);
  });

  it('por defecto las fechas siguen saliendo', () => {
    expect(filasDeCantidades(extraer(doc), false).map((x) => x.seccion)).toEqual(['Montos encontrados', 'Fechas encontradas']);
  });

  it('un documento sin montos da lista vacia (la pantalla muestra el aviso)', () => {
    expect(filasDeCantidades(extraer(['Fecha de emision 31/01/2026']), false, false)).toEqual([]);
  });
});
