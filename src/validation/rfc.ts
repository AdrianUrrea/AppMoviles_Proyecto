import { fechaParaRfc } from './fechas';
import { MSG } from './mensajes';

/**
 * Si es true, se exige que el digito verificador (ultimo caracter) sea correcto.
 * Atrapa la mayoria de errores de captura. Es un riesgo menor: el SAT ha emitido
 * muy pocos RFC historicos que no cumplen el algoritmo. Si un usuario real
 * reporta que su RFC es rechazado, poner en false.
 */
export const VERIFICAR_DIGITO = true;

export const RFC_GENERICOS = ['XAXX010101000', 'XEXX010101000'];

const FORMATO_PERSONA_FISICA = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;

// Tabla oficial de valores: 0-9 -> 0-9, A-N -> 10-23, & -> 24, O-Z -> 25-36, espacio -> 37, Ñ -> 38
const ALFABETO = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ';

export function normalizarRfc(valor: string): string {
  return valor.trim().toUpperCase();
}

/** Digito verificador para los primeros 12 caracteres de un RFC de persona fisica. */
export function calcularDigitoVerificador(base12: string): string {
  let suma = 0;
  for (let i = 0; i < 12; i += 1) {
    suma += ALFABETO.indexOf(base12[i]) * (13 - i);
  }
  const residuo = suma % 11;
  if (residuo === 0) return '0';
  const dv = 11 - residuo;
  return dv === 10 ? 'A' : String(dv);
}

/** Devuelve el mensaje de error o null si el RFC es valido (formato + digito verificador). */
export function validarRfc(valor: string): string | null {
  const rfc = normalizarRfc(valor);
  if (!rfc) return MSG.rfc.obligatorio;
  if (rfc.length !== 13) return MSG.rfc.longitud;
  if (RFC_GENERICOS.includes(rfc)) return MSG.rfc.generico;
  if (!FORMATO_PERSONA_FISICA.test(rfc)) return MSG.rfc.formato;

  const mes = Number(rfc.slice(6, 8));
  const dia = Number(rfc.slice(8, 10));
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return MSG.rfc.formato;

  if (VERIFICAR_DIGITO && rfc[12] !== calcularDigitoVerificador(rfc.slice(0, 12))) {
    return MSG.rfc.digitoVerificador;
  }
  return null;
}

/** La fecha dentro del RFC (posiciones 5 a 10) debe ser la fecha de nacimiento. */
export function rfcCoincideConNacimiento(rfc: string, nacimiento: string): boolean {
  const esperado = fechaParaRfc(nacimiento);
  return esperado !== null && normalizarRfc(rfc).slice(4, 10) === esperado;
}
