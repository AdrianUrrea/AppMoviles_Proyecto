/**
 * Montos de dinero. Se manejan en CENTAVOS ENTEROS para evitar errores de redondeo de decimales
 * (0.1 + 0.2 !== 0.3 en coma flotante). Convencion de Mexico: la coma separa miles y el punto, decimales.
 */

/** 999,999,999.99 */
export const MAX_CENTAVOS = 99_999_999_999;

/** "$1,234.50" | "1234.5" | "1234" -> centavos enteros, o null si no es un monto valido. */
export function aCentavos(texto: string): number | null {
  // Solo se toleran espacios en los extremos y despues del "$". Un espacio en medio ("12 34") es ambiguo: se rechaza.
  const limpio = texto.trim().replace(/^\$\s*/, '');
  if (!/^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/.test(limpio)) return null;
  const [entero, decimales = ''] = limpio.replace(/,/g, '').split('.');
  const centavos = Number(entero) * 100 + Number(decimales.padEnd(2, '0'));
  return Number.isSafeInteger(centavos) ? centavos : null;
}

/** Forma para COPIAR al portal: sin $ ni comas; sin decimales si son .00. 123450 -> "1234.50"; 123400 -> "1234". */
export function montoParaCopiar(centavos: number): string {
  const pesos = Math.floor(centavos / 100);
  const cents = centavos % 100;
  return cents === 0 ? String(pesos) : `${pesos}.${String(cents).padStart(2, '0')}`;
}

/** Forma para MOSTRAR: "$1,234.50". */
export function formatearMonto(centavos: number): string {
  const negativo = centavos < 0;
  const abs = Math.abs(centavos);
  const pesos = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const cents = String(abs % 100).padStart(2, '0');
  return `${negativo ? '-' : ''}$${pesos}.${cents}`;
}

export function sumarCentavos(valores: readonly (number | null)[]): number {
  return valores.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

/** Mensaje de error o null. Vacio = valido (los montos son opcionales). */
export function validarMonto(texto: string): string | null {
  const t = texto.trim();
  if (!t) return null;
  const c = aCentavos(t);
  if (c === null) return 'Ingresa un monto válido, sin signos, por ejemplo 12500.50';
  if (c > MAX_CENTAVOS) return 'El monto es demasiado grande.';
  return null;
}

// ---------------------------------------------------------------- CLABE

const PESOS_CLABE = [3, 7, 1];

export function normalizarClabe(texto: string): string {
  return texto.replace(/[\s-]/g, '');
}

/** Digito verificador de una CLABE a partir de sus primeros 17 digitos. */
export function digitoVerificadorClabe(base17: string): string {
  let suma = 0;
  for (let i = 0; i < 17; i += 1) suma += (Number(base17[i]) * PESOS_CLABE[i % 3]) % 10;
  return String((10 - (suma % 10)) % 10);
}

/** Mensaje de error o null. Vacio = valido (quien la exige lo controla aparte). */
export function validarClabe(texto: string): string | null {
  const c = normalizarClabe(texto);
  if (!c) return null;
  if (!/^\d{18}$/.test(c)) return 'La CLABE debe tener 18 dígitos.';
  if (c[17] !== digitoVerificadorClabe(c.slice(0, 17))) return 'La CLABE no es válida. Revisa que esté bien escrita.';
  return null;
}

/** "002010077777777771" -> "••••••••••••••7771" (se muestra oculta; se copia completa). */
export function enmascararClabe(clabe: string): string {
  return `${'•'.repeat(14)}${clabe.slice(-4)}`;
}
