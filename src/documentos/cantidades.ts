/**
 * Separa las cantidades numericas de un texto leido de un documento (logica pura: sin dependencias de la app).
 *
 * El texto llega de la lectura automatica de la foto (OCR) como una lista de renglones o bloques:
 *  - Android devuelve BLOQUES (cada uno puede traer varios renglones separados por salto de linea).
 *  - iOS devuelve RENGLONES.
 * Por eso todo se parte en renglones antes de buscar. La etiqueta y el monto pueden venir en el mismo renglon
 * ("Sueldos 12,345.00") o en renglones seguidos ("Sueldos" / "12,345.00").
 *
 * Criterio: es mejor NO mostrar un numero dudoso que mostrar uno equivocado. Por eso solo se tratan como
 * "monto" los que traen $, comas de miles o dos decimales. Fechas, RFC, CURP, CLABE, folios, porcentajes y
 * telefonos nunca se confunden con montos (no son un numero "limpio"). Los enteros sueltos (2025, 12345) y los
 * numeros con un decimal se guardan aparte como "otros", y la pantalla los muestra solo si el usuario lo pide.
 */

import { MAX_CENTAVOS, aCentavos, formatearMonto, montoParaCopiar } from '../dinero/montos';
import type { FilaCopia } from '../dinero/formularios';

export type TipoCantidad = 'monto' | 'otro';

export type CantidadEncontrada = {
  id: string;
  tipo: TipoCantidad;
  /** Solo para 'monto'. Para 'otro' vale 0. */
  centavos: number;
  /** Como se leyo en el documento, sin $ ni signos de alrededor. */
  original: string;
  /** Texto cercano que explica la cantidad ("Sueldos y salarios"). Puede ir vacio. */
  etiqueta: string;
  /** Posicion de la cantidad en su renglon cuando hay varias (columnas de una tabla). 1 = la primera. */
  columna: number;
};

const MAX_ETIQUETA = 60;
/** Un entero suelto con mas digitos que esto es casi seguro un telefono, folio o CLABE, no una cantidad. */
const MAX_DIGITOS_OTRO = 9;

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

const SUFIJO_MONEDA = /(?:MXN|M\.?N\.?|USD)$/i;
// signo opcional no se acepta: los negativos se ignoran a proposito (ver mas abajo)
const NUMERO = /^(\$)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?$/;

type Pieza = { texto: string; numero: Omit<CantidadEncontrada, 'id' | 'etiqueta' | 'columna'> | null };

/** Quita puntuacion pegada al token ("(12,345.00)", "12,345.00;", "$12,345.00.") y el sufijo de moneda. */
function limpiarToken(token: string): string {
  let t = token.replace(/^[("'“\[]+/, '').replace(/[)"'”\];:,.]+$/, '');
  if (/\d/.test(t) && SUFIJO_MONEDA.test(t)) t = t.replace(SUFIJO_MONEDA, '');
  return t;
}

function clasificar(token: string): Pieza['numero'] {
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
    return centavos === null || centavos > MAX_CENTAVOS ? null : { tipo: 'monto', centavos, original };
  }

  // Otro: entero suelto (2025, 12345) o numero con un decimal. Se descarta lo que parece telefono, clave o folio.
  if (nDecimales > 1 || digitos.length > MAX_DIGITOS_OTRO) return null;
  if (!decimales && digitos.length > 1 && digitos.startsWith('0')) return null; // "0012"
  return { tipo: 'otro', centavos: 0, original };
}

function aPiezas(renglon: string): Pieza[] {
  const unido = renglon.replace(/\$\s+(?=\d)/g, '$'); // "$ 1,234.50" -> "$1,234.50"
  return unido.split(' ').map((texto) => ({ texto, numero: clasificar(limpiarToken(texto)) }));
}

function limpiarEtiqueta(texto: string): string {
  const t = texto
    .replace(/[$:;|_]+/g, ' ')
    .replace(/\s*[-–.]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/.test(t)) return ''; // sin letras no explica nada
  return t.length > MAX_ETIQUETA ? `${t.slice(0, MAX_ETIQUETA - 1).trimEnd()}…` : t;
}

/**
 * Todas las cantidades del texto, en el orden del documento. No se repite la misma cantidad con la misma
 * etiqueta (los totales suelen aparecer dos veces).
 *
 * Etiqueta de una cantidad:
 *  1. el texto que la antecede en su renglon ("Sueldos y salarios 12,345.00");
 *  2. si va sola en el renglon, el renglon de texto de arriba ("Sueldos y salarios" / "12,345.00"), SIEMPRE que
 *     el renglon de abajo no sea tambien una cantidad sola. Si hay varias cantidades solas seguidas puede ser una
 *     columna de nombres junto a una columna de montos: no se sabe cual corresponde a cual, y es mejor dejarla
 *     "sin etiqueta" que poner una equivocada;
 *  3. en una fila con varios montos (columnas de una tabla), los siguientes usan la etiqueta del primero.
 */
export function extraerCantidades(texto: readonly string[]): CantidadEncontrada[] {
  const filas = aRenglones(texto).map(aPiezas);
  const salida: CantidadEncontrada[] = [];
  const vistos = new Set<string>();

  const sinNumeros = (piezas: readonly Pieza[] | undefined) => !!piezas && !piezas.some((p) => p.numero);
  const soloNumeros = (piezas: readonly Pieza[] | undefined) => !!piezas && piezas.length > 0 && piezas.every((p) => p.numero);

  for (let i = 0; i < filas.length; i++) {
    const piezas = filas[i];
    if (sinNumeros(piezas)) continue;

    const montosEnRenglon = piezas.filter((p) => p.numero?.tipo === 'monto').length;
    const previa = filas[i - 1];
    const etiquetaDeArriba =
      sinNumeros(previa) && !soloNumeros(filas[i + 1]) ? limpiarEtiqueta(previa.map((p) => p.texto).join(' ')) : '';

    let palabras: string[] = [];
    let base = ''; // etiqueta del primer monto de la fila
    let columna = 0;

    for (const pieza of piezas) {
      const numero = pieza.numero;
      if (!numero) {
        palabras.push(pieza.texto);
        continue;
      }
      let etiqueta = limpiarEtiqueta(palabras.join(' '));
      palabras = [];

      let col = 1;
      if (numero.tipo === 'monto') {
        columna += 1;
        col = montosEnRenglon > 1 ? columna : 1;
        if (columna === 1) {
          etiqueta = etiqueta || etiquetaDeArriba;
          base = etiqueta;
        } else if (!etiqueta) {
          etiqueta = base;
        }
      }

      const valor = numero.tipo === 'monto' ? String(numero.centavos) : numero.original;
      const llave = `${numero.tipo}|${valor}|${etiqueta.toLowerCase()}`;
      if (vistos.has(llave)) continue;
      vistos.add(llave);
      salida.push({ id: `c${salida.length}`, ...numero, etiqueta, columna: col });
    }
  }
  return salida;
}

const SECCION_MONTOS = 'Cantidades encontradas';
const SECCION_OTROS = 'Otros números (revísalos)';

/**
 * Filas para la lista de "copiar". Los montos se copian como en "Mis datos de dinero" ("1234.50"),
 * listos para pegar. Los numeros "otros" se copian y se muestran tal cual se leyeron, sin formato de dinero.
 */
export function filasDeCantidades(cantidades: readonly CantidadEncontrada[], incluirOtros: boolean): FilaCopia[] {
  const filas: FilaCopia[] = [];
  const etiquetaDe = (c: CantidadEncontrada) => {
    const base = c.etiqueta || 'Sin etiqueta';
    return c.columna > 1 ? `${base} · columna ${c.columna}` : base;
  };
  for (const c of cantidades) {
    if (c.tipo !== 'monto') continue;
    filas.push({
      id: c.id,
      seccion: SECCION_MONTOS,
      etiqueta: etiquetaDe(c),
      copiar: montoParaCopiar(c.centavos),
      mostrar: formatearMonto(c.centavos),
      sensible: false,
    });
  }
  if (incluirOtros) {
    for (const c of cantidades) {
      if (c.tipo !== 'otro') continue;
      const limpio = c.original.replace(/,/g, '');
      filas.push({ id: c.id, seccion: SECCION_OTROS, etiqueta: etiquetaDe(c), copiar: limpio, mostrar: c.original, sensible: false });
    }
  }
  return filas;
}

export function contarPorTipo(cantidades: readonly CantidadEncontrada[]): { montos: number; otros: number } {
  let montos = 0;
  for (const c of cantidades) if (c.tipo === 'monto') montos += 1;
  return { montos, otros: cantidades.length - montos };
}
