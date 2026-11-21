/**
 * Cuanto hay que desplazar el scroll para que un campo de texto quede visible sobre el teclado (logica pura).
 *
 * Todas las medidas son coordenadas de ventana (como `measureInWindow`), en el mismo sistema:
 *  - `campoArriba` / `campoAbajo`: borde superior e inferior del campo enfocado.
 *  - `zonaArriba` / `zonaAbajo`: area donde si se ve el contenido (debajo del encabezado y sobre el teclado y la barra fija).
 *  - `margen`: aire que se deja entre el campo y el borde de la zona.
 *
 * Devuelve pixeles: positivo = bajar el contenido (scroll hacia abajo), negativo = subirlo, 0 = ya se ve.
 * Si el campo no cabe entero en la zona, gana mostrar su parte de arriba (donde se escribe).
 */
export type MedidasCampo = {
  campoArriba: number;
  campoAbajo: number;
  zonaArriba: number;
  zonaAbajo: number;
  margen: number;
};

export function desplazamientoParaVer({ campoArriba, campoAbajo, zonaArriba, zonaAbajo, margen }: MedidasCampo): number {
  if (![campoArriba, campoAbajo, zonaArriba, zonaAbajo, margen].every(Number.isFinite)) return 0;

  const faltaAbajo = campoAbajo + margen - zonaAbajo;
  if (faltaAbajo > 0) {
    const maximo = Math.max(campoArriba - (zonaArriba + margen), 0); // no sacar el inicio del campo por arriba
    return Math.min(faltaAbajo, maximo);
  }

  const faltaArriba = zonaArriba + margen - campoArriba;
  if (faltaArriba > 0) return -faltaArriba;

  return 0;
}
