/**
 * Separa montos, fechas y otros numeros de un texto leido de un documento (logica pura: sin dependencias de la app).
 *
 * El texto llega de la lectura automatica de la foto (OCR) como una lista de renglones o bloques:
 *  - Android devuelve BLOQUES (cada uno puede traer varios renglones separados por salto de linea).
 *  - iOS devuelve RENGLONES.
 * Por eso todo se parte en renglones antes de buscar. El OCR NO entrega posiciones en la hoja, asi que el vinculo
 * entre un dato y su etiqueta se deduce solo por el orden del texto.
 *
 * Criterio: es mejor NO mostrar un dato dudoso que mostrar uno equivocado, y cuando se muestra uno que se dedujo
 * (etiqueta emparejada por posicion, cifras unidas, monto sin centavos...) se le agrega un AVISO para que la persona
 * lo compare con su documento. Cada dato guarda ademas el renglon del que salio (`fuente`).
 *
 *  - MONTO: lleva $, comas de miles, o dos decimales (tambien con coma decimal: "1.234,50"). Un entero sin
 *    centavos ("345678") solo es monto si su etiqueta habla de dinero ("Sueldos", "ISR retenido", "Total"...).
 *  - FECHA: "31/01/2026", "31-01-26", "2026-01-31", "31 de enero de 2026", "15-ENE-2027". Se valida el calendario.
 *    Se asume dia/mes/anio (convencion de Mexico); solo se invierte si el "mes" es mayor que 12.
 *  - OTRO: enteros sueltos (2025, 22800) y numeros con un decimal. La pantalla los muestra solo si se piden.
 *  RFC, CURP, CLABE, UUID, folios, porcentajes, horas y telefonos nunca se confunden con montos.
 */

import { MAX_CENTAVOS, aCentavos, formatearMonto, montoParaCopiar } from '../dinero/montos';
import type { FilaCopia } from '../dinero/formularios';
import { MESES } from '../recordatorios/nombres';
import { parseFechaIso } from '../validation/fechas';

export type TipoCantidad = 'monto' | 'fecha' | 'otro';

export type CantidadEncontrada = {
  id: string;
  tipo: TipoCantidad;
  /** Solo para 'monto'. Para los demas vale 0. */
  centavos: number;
  /** Solo para 'fecha': "AAAA-MM-DD". Para los demas va vacio. */
  iso: string;
  /** Como se leyo en el documento, sin $ ni signos de alrededor. */
  original: string;
  /** Texto cercano que explica el dato ("Sueldos y salarios"). Puede ir vacio. */
  etiqueta: string;
  /** Posicion del dato en su renglon cuando hay varios (columnas de una tabla, rango de fechas). 1 = el primero. */
  columna: number;
  /** Nombre de la columna si el documento trae encabezado de tabla ("Importe"), o "inicio"/"fin" en un rango de fechas. */
  columnaNombre: string;
  /** Renglon(es) del documento de donde salio, para que la persona lo ubique en su hoja. */
  fuente: string;
  /** Motivos por los que conviene comparar este dato con el documento. Vacio = lectura directa. */
  avisos: readonly string[];
};

const MAX_ETIQUETA = 60;
const MAX_FUENTE = 90;
/** Un entero suelto con mas digitos que esto es casi seguro un telefono, folio o CLABE, no una cantidad. */
const MAX_DIGITOS_OTRO = 9;

const AVISO = {
  espacio: 'Las cifras venían separadas por un espacio. Confirma que el monto esté completo.',
  sinCentavos: 'En el documento venía sin centavos. Confirma el monto.',
  letras: 'Se corrigieron letras que se leyeron como números. Confirma el valor.',
  posicion: 'Se emparejó con su concepto por el orden del texto. Compáralo con tu documento.',
  anioCorto: 'El año venía con dos dígitos; se interpretó como',
} as const;

/** Parte la salida del OCR en renglones (bloques con saltos de linea incluidos), sin renglones vacios. */
export function aRenglones(texto: readonly string[]): string[] {
  const salida: string[] = [];
  for (const bloque of texto) {
    for (const r of String(bloque).split(/\r?\n/)) {
      const limpio = r.replace(/\s+/g, ' ').trim();
      if (limpio) salida.push(limpio);
    }
  }
  return salida;
}

const ACENTOS: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n' };
function sinAcentos(t: string): string {
  return t.toLowerCase().replace(/[áéíóúüñ]/g, (c) => ACENTOS[c] ?? c);
}

// ------------------------------------------------------------------ tipos internos

type DatoMonto = { tipo: 'monto'; centavos: number; original: string; avisos: string[] };
type DatoFecha = { tipo: 'fecha'; iso: string; original: string; avisos: string[] };
type DatoOtro = { tipo: 'otro'; original: string; avisos: string[] };
type Dato = DatoMonto | DatoFecha | DatoOtro;
type Pieza = { texto: string; dato: Dato | null };

// ------------------------------------------------------------------ fechas

const MES_RE =
  '(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|setiembre|sept|sep|set|octubre|oct|noviembre|nov|diciembre|dic)';
/** dia/mes/anio: 31/01/2026, 31-01-26, 31.01.2026 */
const FECHA_DMA = /(\d{1,2})([/.-])(\d{1,2})\2(\d{4}|\d{2})(?!\d)/g;
/** anio/mes/dia: 2026-01-31, 2026/01/31 */
const FECHA_AMD = /(\d{4})([/.-])(\d{1,2})\2(\d{1,2})(?!\d)/g;
/** 31 de enero de 2026, 31 ene 2026, 15-ENE-2027, 15/ene/27 */
const FECHA_TEXTO = new RegExp(
  `(\\d{1,2})\\s*(?:de\\s+|[/.-]\\s*)?${MES_RE}(?![a-záéíóúñ])\\.?\\s*(?:(?:de|del)\\s+|[/.,-]\\s*)?(\\d{4}|\\d{2})(?!\\d)`,
  'gi',
);

const NUMERO_DE_MES: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12,
};

type SpanFecha = { ini: number; fin: number; dato: DatoFecha };

function coincidencias(re: RegExp, texto: string): RegExpExecArray[] {
  const salida: RegExpExecArray[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    if (m[0].length === 0) re.lastIndex += 1;
    else salida.push(m);
  }
  return salida;
}

/** La fecha no debe estar pegada a letras, digitos u otros separadores (para no tomar pedazos de un UUID o un folio). */
function bordeLimpio(texto: string, ini: number, fin: number): boolean {
  const antes = texto[ini - 1];
  const despues = texto[fin];
  if (antes !== undefined && /[A-Za-zÁ-ÿ0-9/.-]/.test(antes)) return false;
  if (despues !== undefined && /[A-Za-zÁ-ÿ0-9/]/.test(despues)) return false;
  return true;
}

function dosDigitosAAnio(yy: number): number {
  return yy <= 69 ? 2000 + yy : 1900 + yy;
}

function construirFecha(y: number, m: number, d: number, original: string, anioCorto: boolean): DatoFecha | null {
  // Antes de 1920 casi seguro es el nombre de una calle ("20 de Noviembre 1910", "5 de Mayo 1862"), no una fecha.
  if (y < 1920 || y > 2100) return null;
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  if (!parseFechaIso(iso)) return null; // 31/02/2026 y similares no existen
  return { tipo: 'fecha', iso, original, avisos: anioCorto ? [`${AVISO.anioCorto} ${y}.`] : [] };
}

function buscarFechas(texto: string): SpanFecha[] {
  const candidatas: SpanFecha[] = [];

  for (const m of coincidencias(FECHA_DMA, texto)) {
    const ini = m.index;
    const fin = ini + m[0].length;
    if (!bordeLimpio(texto, ini, fin)) continue;
    const [, a, sep, b, anio] = m;
    if (anio.length === 2 && sep === '.') continue; // "1.2.25" es mas probable un numero que una fecha
    let d = Number(a);
    let mes = Number(b);
    if (d <= 12 && mes > 12) [d, mes] = [mes, d]; // mes/dia/anio (solo cuando es la unica lectura posible)
    const y = anio.length === 2 ? dosDigitosAAnio(Number(anio)) : Number(anio);
    const dato = construirFecha(y, mes, d, m[0], anio.length === 2);
    if (dato) candidatas.push({ ini, fin, dato });
  }

  for (const m of coincidencias(FECHA_AMD, texto)) {
    const ini = m.index;
    const fin = ini + m[0].length;
    if (!bordeLimpio(texto, ini, fin)) continue;
    const dato = construirFecha(Number(m[1]), Number(m[3]), Number(m[4]), m[0], false);
    if (dato) candidatas.push({ ini, fin, dato });
  }

  for (const m of coincidencias(FECHA_TEXTO, texto)) {
    const ini = m.index;
    const fin = ini + m[0].length;
    if (!bordeLimpio(texto, ini, fin)) continue;
    const mes = NUMERO_DE_MES[sinAcentos(m[2]).slice(0, 3)];
    const anio = m[3];
    if (!mes) continue;
    const y = anio.length === 2 ? dosDigitosAAnio(Number(anio)) : Number(anio);
    const dato = construirFecha(y, mes, Number(m[1]), m[0], anio.length === 2);
    if (dato) candidatas.push({ ini, fin, dato });
  }

  // Sin traslapes: gana la que empieza primero y, a igual inicio, la mas larga.
  candidatas.sort((x, y) => x.ini - y.ini || y.fin - x.fin);
  const salida: SpanFecha[] = [];
  let ultimoFin = -1;
  for (const c of candidatas) {
    if (c.ini < ultimoFin) continue;
    salida.push(c);
    ultimoFin = c.fin;
  }
  return salida;
}

// ------------------------------------------------------------------ montos y otros numeros

const SUFIJO_MONEDA = /(?:MXN|M\.?N\.?|USD)$/i;
// signo opcional no se acepta: los negativos se ignoran a proposito
const NUMERO = /^(\$)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?$/;
/** Coma decimal: "1234,50", "1.234,50" y el error tipico del OCR "1,234,50" (el punto leido como coma). */
const NUMERO_COMA_DECIMAL = /^\$?(\d{1,3}(?:[.,]\d{3})+|\d+),(\d{2})$/;

function conMiles(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Quita puntuacion pegada al token ("(12,345.00)", "12,345.00;", "$12,345.00.") y el sufijo de moneda. */
function limpiarToken(token: string): string {
  let t = token.replace(/^[("'“\[]+/, '').replace(/[)"'”\];:,.]+$/, '');
  if (/\d/.test(t) && SUFIJO_MONEDA.test(t)) t = t.replace(SUFIJO_MONEDA, '');
  return t;
}

/** Corrige confusiones tipicas del OCR dentro de un numero: la letra O por cero y la S por el signo $. */
function repararToken(t: string): { texto: string; avisos: string[] } {
  const avisos: string[] = [];
  let r = t;
  if (/^[$S]?[\dOo.,]{3,}$/.test(r) && /[Oo]/.test(r) && (r.match(/\d/g) ?? []).length >= 2) {
    r = r.replace(/[Oo]/g, '0');
    avisos.push(AVISO.letras);
  }
  if (/^S\d/.test(r) && (/\d,\d{3}/.test(r) || /[.,]\d{2}$/.test(r))) r = `$${r.slice(1)}`;
  return { texto: r, avisos };
}

function clasificar(crudo: string): Dato | null {
  const { texto: token, avisos } = repararToken(crudo);

  const eu = NUMERO_COMA_DECIMAL.exec(token);
  if (eu) {
    const original = `${conMiles(eu[1].replace(/[.,]/g, ''))}.${eu[2]}`;
    const centavos = aCentavos(original);
    return centavos === null || centavos > MAX_CENTAVOS ? null : { tipo: 'monto', centavos, original, avisos };
  }

  const m = NUMERO.exec(token);
  if (!m) return null;
  const [, signoPeso, entero, decimales = ''] = m; // decimales incluye el punto: ".50"
  const nDecimales = decimales ? decimales.length - 1 : 0;
  const digitos = entero.replace(/,/g, '');
  const original = `${entero}${decimales}`;

  // Monto: lleva $, comas de miles o exactamente dos decimales.
  if (signoPeso || entero.includes(',') || nDecimales === 2) {
    if (nDecimales > 2) return null; // "12,345.678" no es dinero
    const centavos = aCentavos(original);
    return centavos === null || centavos > MAX_CENTAVOS ? null : { tipo: 'monto', centavos, original, avisos };
  }

  // Otro: entero suelto (2025, 12345) o numero con un decimal. Se descarta lo que parece telefono, clave o folio.
  if (nDecimales > 1 || digitos.length > MAX_DIGITOS_OTRO) return null;
  if (!decimales && digitos.length > 1 && digitos.startsWith('0')) return null; // "0012"
  return { tipo: 'otro', original, avisos };
}

/**
 * Montos que el OCR leyo con un espacio en lugar de la coma de miles ("12 345.00"). Sin esto se leia como
 * "345.00" (un monto equivocado). Se junta y se marca para que la persona lo confirme.
 */
function unirMilesConEspacio(tokens: readonly string[], i: number): { texto: string; consumidos: number; dato: DatoMonto } | null {
  const primero = /^\d{1,3}$/.exec(limpiarToken(tokens[i]));
  if (!primero) return null;
  const grupos = [primero[0]];
  let j = i + 1;
  while (j < tokens.length && /^\d{3}$/.test(tokens[j])) {
    grupos.push(tokens[j]);
    j += 1;
  }
  if (j >= tokens.length) return null;
  const ultimo = /^(\d{3})[.,](\d{2})$/.exec(limpiarToken(tokens[j]));
  if (!ultimo) return null;
  grupos.push(ultimo[1]);
  const original = `${grupos.join(',')}.${ultimo[2]}`;
  const centavos = aCentavos(original);
  if (centavos === null || centavos > MAX_CENTAVOS) return null;
  return {
    texto: tokens.slice(i, j + 1).join(' '),
    consumidos: j - i + 1,
    dato: { tipo: 'monto', centavos, original, avisos: [AVISO.espacio] },
  };
}

function tokenizar(trozo: string): Pieza[] {
  const tokens = trozo.split(' ').filter(Boolean);
  const piezas: Pieza[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const unido = unirMilesConEspacio(tokens, i);
    if (unido) {
      piezas.push({ texto: unido.texto, dato: unido.dato });
      i += unido.consumidos - 1;
      continue;
    }
    const esPorcentaje = tokens[i + 1] === '%'; // "11 %": el OCR separo el signo del numero
    piezas.push({ texto: tokens[i], dato: esPorcentaje ? null : clasificar(limpiarToken(tokens[i])) });
  }
  return piezas;
}

/** Las fechas se buscan primero (pueden traer espacios: "31 de enero de 2026") y el resto del renglon se separa en palabras. */
function aPiezas(renglon: string): Pieza[] {
  const unido = renglon.replace(/\$\s+(?=\d)/g, '$'); // "$ 1,234.50" -> "$1,234.50"
  const piezas: Pieza[] = [];
  let cursor = 0;
  for (const f of buscarFechas(unido)) {
    piezas.push(...tokenizar(unido.slice(cursor, f.ini)));
    piezas.push({ texto: unido.slice(f.ini, f.fin), dato: f.dato });
    cursor = f.fin;
  }
  piezas.push(...tokenizar(unido.slice(cursor)));
  return piezas;
}

// ------------------------------------------------------------------ enteros que si son dinero

/** Etiquetas (sin acentos) que hablan de dinero: un entero junto a ellas ("Sueldos 345678") es un monto sin centavos. */
const ETIQUETA_DE_DINERO =
  /\b(sueldo|salario|ingreso|importe|monto|total|subtotal|isr|iva|ieps|impuesto|retencion|retenido|deduc|percepc|pago|honorario|renta|arrendamiento|aguinaldo|prima|vales|ptu|ahorro|saldo|favor|cargo|interes|dividendo|ganancia|utilidad|comision|credito|colegiatura|gasto|precio|costo|pesos|aportacion|devolucion|gravable|exento|cuota|bono|prestacion)/;
/** Etiquetas que dicen que el entero es otra cosa (anio, folio, codigo postal...), aunque tambien mencionen dinero. */
const ETIQUETA_NO_DINERO =
  /\b(ano|ejercicio|folio|numero|num|no|codigo|cp|postal|hijos|dependientes|edad|pagina|paginas|meses|dias|semanas|periodo|clave|telefono|tel|serie|version|factor|tasa|porcentaje|lote)\b/;

/**
 * Un entero con etiqueta de dinero pasa a monto (sin centavos). Los parecidos a un anio se quedan como "otro".
 * La etiqueta debe ir ANTES del numero en su renglon ("Sueldos 345678"). Un numero al inicio del renglon seguido de
 * texto ("236505 SALARIOS Y DEMAS PAGOS") es un codigo (contable, de concepto...), no una cantidad.
 */
function promoverEntero(dato: Dato, etiquetaPrevia: string): Dato {
  if (dato.tipo !== 'otro' || !/^\d{3,9}$/.test(dato.original) || dato.original.startsWith('0')) return dato;
  const n = Number(dato.original);
  if (n >= 1990 && n <= 2100) return dato;
  const e = sinAcentos(etiquetaPrevia);
  if (!e || !ETIQUETA_DE_DINERO.test(e) || ETIQUETA_NO_DINERO.test(e)) return dato;
  const centavos = aCentavos(dato.original);
  if (centavos === null || centavos > MAX_CENTAVOS) return dato;
  return { tipo: 'monto', centavos, original: dato.original, avisos: [...dato.avisos, AVISO.sinCentavos] };
}

// ------------------------------------------------------------------ etiquetas

const CONECTOR = /^(?:al?|hasta|y|e|de|del|el|la|las|los|en|con|por)$/i;
const MONEDA = /^(?:MXN|M\.?N\.?|USD|pesos?)$/i;

function limpiarEtiqueta(texto: string): string {
  const base = texto
    .replace(/[$:;|_]+/g, ' ')
    .replace(/\s*[-–.]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const palabras = base.split(' ').filter(Boolean);
  // "Periodo del" -> "Periodo"; "Importe en pesos" -> "Importe"
  while (palabras.length > 0 && (CONECTOR.test(palabras[palabras.length - 1]) || MONEDA.test(palabras[palabras.length - 1]))) palabras.pop();
  while (palabras.length > 0 && MONEDA.test(palabras[0])) palabras.shift();
  const t = palabras.join(' ');
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/.test(t)) return ''; // sin letras no explica nada
  return t.length > MAX_ETIQUETA ? `${t.slice(0, MAX_ETIQUETA - 1).trimEnd()}…` : t;
}

function recortarFuente(t: string): string {
  return t.length > MAX_FUENTE ? `${t.slice(0, MAX_FUENTE - 1).trimEnd()}…` : t;
}

const tieneDato = (piezas: readonly Pieza[]) => piezas.some((p) => p.dato);
const soloTexto = (piezas: readonly Pieza[]) => piezas.length > 0 && !tieneDato(piezas);

/** Texto entre la pieza `desde` y el siguiente dato (o el final del renglon). */
function textoDespuesDe(piezas: readonly Pieza[], desde: number): string {
  const palabras: string[] = [];
  for (let k = desde + 1; k < piezas.length && !piezas[k].dato; k++) palabras.push(piezas[k].texto);
  return palabras.join(' ');
}

/** Etiqueta que el propio renglon da a sus datos: el texto antes del primero o, si no hay, el que sigue al primero. */
function etiquetaPropia(piezas: readonly Pieza[]): string {
  const indices: number[] = [];
  piezas.forEach((p, k) => {
    if (p.dato) indices.push(k);
  });
  if (indices.length === 0) return '';
  let desde = 0;
  for (const k of indices) {
    const pre = limpiarEtiqueta(
      piezas
        .slice(desde, k)
        .map((p) => p.texto)
        .join(' '),
    );
    if (pre) return pre;
    desde = k + 1;
  }
  return limpiarEtiqueta(textoDespuesDe(piezas, indices[0]));
}

/** Un renglon que empieza en minuscula continua al anterior ("Sueldos y salarios" / "del ejercicio"). */
function esContinuacion(texto: string): boolean {
  return /^[a-záéíóúüñ(]/.test(texto);
}

type EtiquetaDeArriba = { etiqueta: string; inferida: boolean; fuente: string };

/**
 * Para los renglones con datos pero SIN etiqueta propia, busca la etiqueta en los renglones de texto de arriba:
 *  - un renglon de datos con un renglon de texto encima: ese texto es su etiqueta ("Sueldos" / "12,345.00");
 *  - varios renglones de datos seguidos (columna de montos) con tantos renglones de texto encima (columna de
 *    nombres, tipico de Android): se emparejan en orden. Es una deduccion, asi que se marca `inferida`.
 *  Si no cuadra la cantidad de nombres con la de datos, no se adivina nada.
 */
function resolverEtiquetasDeArriba(filas: readonly Pieza[][], renglones: readonly string[], propias: readonly string[]): Map<number, EtiquetaDeArriba> {
  const mapa = new Map<number, EtiquetaDeArriba>();
  for (let i = 0; i < filas.length; i++) {
    if (!tieneDato(filas[i]) || propias[i]) continue;

    let j = i;
    while (j + 1 < filas.length && tieneDato(filas[j + 1]) && !propias[j + 1]) j++;
    const cuantos = j - i + 1;

    const textos: number[] = [];
    for (let k = i - 1; k >= 0 && soloTexto(filas[k]) && textos.length < 12; k--) textos.unshift(k);

    const logicas: string[] = [];
    for (const k of textos) {
      if (logicas.length > 0 && esContinuacion(renglones[k])) logicas[logicas.length - 1] += ` ${renglones[k]}`;
      else logicas.push(renglones[k]);
    }

    // Con varias cantidades solo se empareja si cuadra: tantos nombres como cantidades, o uno mas (el encabezado de
    // la columna). En una tabla grande con celdas vacias sobran nombres, y emparejar desde el final daria etiquetas
    // equivocadas: ahi es mejor dejar la cantidad sin etiqueta.
    const cuadra = cuantos === 1 ? logicas.length >= 1 : logicas.length === cuantos || logicas.length === cuantos + 1;
    if (cuadra) {
      logicas.slice(logicas.length - cuantos).forEach((texto, q) => {
        const etiqueta = limpiarEtiqueta(texto);
        if (etiqueta) mapa.set(i + q, { etiqueta, inferida: cuantos > 1, fuente: texto });
      });
    }
    i = j;
  }
  return mapa;
}

/**
 * Nombres de columna de una tabla: el renglon de texto de arriba con una palabra de mas que montos tiene el renglon
 * ("Concepto Importe Retencion" para "Sueldos 10,000.00 1,500.00"). Si no cuadra exacto, no se usa.
 */
function encabezadoDe(filas: readonly Pieza[][], desde: number, montos: number): string[] | null {
  for (let k = desde - 1; k >= 0 && desde - k <= 15; k--) {
    if (tieneDato(filas[k])) continue; // cuerpo de la tabla
    const palabras = filas[k].map((p) => p.texto.replace(/[:;]+$/, ''));
    const valido = palabras.length === montos + 1 && palabras.every((t) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ./()-]{2,20}$/.test(t));
    return valido ? palabras.slice(1) : null;
  }
  return null;
}

type Celda = {
  dato: Dato;
  etiqueta: string;
  /** Texto crudo entre el dato anterior y este (para reconocer "del ... al ..."). */
  previo: string;
  viaArriba: boolean;
  inferida: boolean;
};

const CONECTOR_DE_RANGO = /^(?:al?|hasta|-|–|—)$/i;

/**
 * Todos los datos del texto, en el orden del documento. No se repite el mismo dato con la misma etiqueta
 * (los totales suelen aparecer dos veces).
 *
 * Etiqueta de un dato, en este orden:
 *  1. el texto que lo antecede en su renglon ("Sueldos y salarios 12,345.00");
 *  2. si va primero y nada lo antecede, el texto que lo sigue ("$ 1,000.00 Sueldos");
 *  3. en un renglon con varios datos del mismo tipo (columnas de una tabla), usa la del primero;
 *  4. el texto de arriba (ver `resolverEtiquetasDeArriba`).
 */
export function extraerCantidades(texto: readonly string[]): CantidadEncontrada[] {
  const renglones = aRenglones(texto);
  const filas = renglones.map(aPiezas);
  const propias = filas.map(etiquetaPropia);
  const arriba = resolverEtiquetasDeArriba(filas, renglones, propias);

  const salida: CantidadEncontrada[] = [];
  const vistos = new Set<string>();

  for (let i = 0; i < filas.length; i++) {
    const piezas = filas[i];
    if (!tieneDato(piezas)) continue;
    const deArriba = arriba.get(i);

    // Pasada 1: etiqueta de cada dato (y enteros que en realidad son dinero).
    const celdas: Celda[] = [];
    const bases: Partial<Record<'monto' | 'fecha', Celda>> = {};
    let palabras: string[] = [];
    let primero = true;
    for (let k = 0; k < piezas.length; k++) {
      const pieza = piezas[k];
      if (!pieza.dato) {
        palabras.push(pieza.texto);
        continue;
      }
      const previo = palabras.join(' ');
      palabras = [];

      let etiqueta = limpiarEtiqueta(previo);
      let viaArriba = false;
      let inferida = false;
      if (!etiqueta && primero) etiqueta = limpiarEtiqueta(textoDespuesDe(piezas, k));
      if (!etiqueta && pieza.dato.tipo !== 'otro') {
        const base = bases[pieza.dato.tipo];
        if (base?.etiqueta) ({ etiqueta, viaArriba, inferida } = base);
      }
      if (!etiqueta && deArriba) {
        etiqueta = deArriba.etiqueta;
        inferida = deArriba.inferida;
        viaArriba = true;
      }

      const dato = promoverEntero(pieza.dato, limpiarEtiqueta(previo));
      const celda: Celda = { dato, etiqueta, previo, viaArriba, inferida };
      celdas.push(celda);
      if (dato.tipo !== 'otro' && !bases[dato.tipo]) bases[dato.tipo] = celda;
      primero = false;
    }

    // Pasada 2: columnas, nombres de columna y alta en la lista.
    const nMontos = celdas.filter((c) => c.dato.tipo === 'monto').length;
    const nFechas = celdas.filter((c) => c.dato.tipo === 'fecha').length;
    const hayEtiquetaPropia = celdas.some((c) => c.dato.tipo === 'monto' && c.etiqueta && !c.viaArriba);
    const encabezados = nMontos >= 2 && hayEtiquetaPropia ? encabezadoDe(filas, i, nMontos) : null;
    const fechasDeLaFila = celdas.filter((c) => c.dato.tipo === 'fecha');
    const esRango = fechasDeLaFila.length === 2 && CONECTOR_DE_RANGO.test(fechasDeLaFila[1].previo);
    const fuenteDelRenglon = recortarFuente(renglones[i]);

    let colMonto = 0;
    let colFecha = 0;
    for (const c of celdas) {
      const d = c.dato;
      let columna = 1;
      let columnaNombre = '';
      if (d.tipo === 'monto') {
        colMonto += 1;
        columna = nMontos > 1 ? colMonto : 1;
        if (encabezados && nMontos > 1) columnaNombre = encabezados[colMonto - 1] ?? '';
      } else if (d.tipo === 'fecha') {
        colFecha += 1;
        columna = nFechas > 1 ? colFecha : 1;
        if (esRango) columnaNombre = colFecha === 1 ? 'inicio' : 'fin';
      }

      const valor = d.tipo === 'monto' ? String(d.centavos) : d.tipo === 'fecha' ? d.iso : d.original;
      const llave = `${d.tipo}|${valor}|${c.etiqueta.toLowerCase()}|${columna}`;
      if (vistos.has(llave)) continue;
      vistos.add(llave);

      salida.push({
        id: `c${salida.length}`,
        tipo: d.tipo,
        centavos: d.tipo === 'monto' ? d.centavos : 0,
        iso: d.tipo === 'fecha' ? d.iso : '',
        original: d.original,
        etiqueta: c.etiqueta,
        columna,
        columnaNombre,
        fuente: c.viaArriba && deArriba ? recortarFuente(`${deArriba.fuente} / ${renglones[i]}`) : fuenteDelRenglon,
        avisos: c.inferida ? [...d.avisos, AVISO.posicion] : d.avisos,
      });
    }
  }
  return salida;
}

// ------------------------------------------------------------------ filas para copiar

const SECCION_MONTOS = 'Montos encontrados';
const SECCION_FECHAS = 'Fechas encontradas';
const SECCION_OTROS = 'Otros números (revísalos)';

function etiquetaDe(c: CantidadEncontrada): string {
  const base = c.etiqueta || 'Sin etiqueta';
  if (c.columnaNombre) return `${base} · ${c.columnaNombre}`;
  if (c.columna > 1) return `${base} · ${c.tipo === 'fecha' ? 'fecha' : 'columna'} ${c.columna}`;
  return base;
}

function detalleDe(c: CantidadEncontrada): string | undefined {
  return c.fuente ? `Se leyó en: “${c.fuente}”` : undefined;
}

function avisoDe(c: CantidadEncontrada): string | undefined {
  return c.avisos.length > 0 ? c.avisos.join(' ') : undefined;
}

/** "2026-01-31" -> copiar "31/01/2026", mostrar "31 de enero de 2026". */
function formasDeFecha(iso: string): { copiar: string; mostrar: string } {
  const f = parseFechaIso(iso);
  if (!f) return { copiar: iso, mostrar: iso };
  const dd = String(f.d).padStart(2, '0');
  const mm = String(f.m).padStart(2, '0');
  return { copiar: `${dd}/${mm}/${f.y}`, mostrar: `${f.d} de ${MESES[f.m - 1]} de ${f.y}` };
}

/**
 * Filas para la lista de "copiar", en este orden: montos, fechas (salvo que se oculten) y (si se piden) otros numeros.
 * Los montos se copian como en "Mis datos de dinero" ("1234.50"), listos para pegar; las fechas como DD/MM/AAAA.
 * Los "otros" se copian y se muestran tal cual se leyeron, sin formato de dinero.
 */
export function filasDeCantidades(cantidades: readonly CantidadEncontrada[], incluirOtros: boolean, incluirFechas = true): FilaCopia[] {
  const filas: FilaCopia[] = [];
  for (const c of cantidades) {
    if (c.tipo !== 'monto') continue;
    filas.push({
      id: c.id,
      seccion: SECCION_MONTOS,
      etiqueta: etiquetaDe(c),
      copiar: montoParaCopiar(c.centavos),
      mostrar: formatearMonto(c.centavos),
      sensible: false,
      detalle: detalleDe(c),
      aviso: avisoDe(c),
    });
  }
  for (const c of cantidades) {
    if (!incluirFechas || c.tipo !== 'fecha') continue;
    const { copiar, mostrar } = formasDeFecha(c.iso);
    filas.push({ id: c.id, seccion: SECCION_FECHAS, etiqueta: etiquetaDe(c), copiar, mostrar, sensible: false, detalle: detalleDe(c), aviso: avisoDe(c) });
  }
  if (incluirOtros) {
    for (const c of cantidades) {
      if (c.tipo !== 'otro') continue;
      const limpio = c.original.replace(/,/g, '');
      filas.push({
        id: c.id,
        seccion: SECCION_OTROS,
        etiqueta: etiquetaDe(c),
        copiar: limpio,
        mostrar: c.original,
        sensible: false,
        detalle: detalleDe(c),
        aviso: avisoDe(c),
      });
    }
  }
  return filas;
}

export function contarPorTipo(cantidades: readonly CantidadEncontrada[]): { montos: number; fechas: number; otros: number } {
  const cuenta = { montos: 0, fechas: 0, otros: 0 };
  for (const c of cantidades) {
    if (c.tipo === 'monto') cuenta.montos += 1;
    else if (c.tipo === 'fecha') cuenta.fechas += 1;
    else cuenta.otros += 1;
  }
  return cuenta;
}
