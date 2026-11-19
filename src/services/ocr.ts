/**
 * Lectura de texto de una foto (OCR) en el telefono: Google ML Kit en Android y Apple Vision en iOS, via
 * `expo-text-extractor`. La imagen NO sale del telefono.
 *
 * El modulo es nativo: NO existe en Expo Go, solo en una version de desarrollo o de produccion de la app
 * (`npx expo run:android` / `npx expo run:ios`, o una build de EAS). Por eso se carga con `require` dentro de
 * un try: en Expo Go la app sigue funcionando y simplemente oculta el boton.
 *
 * Android devuelve bloques de texto (pueden traer varios renglones) e iOS devuelve renglones;
 * `extraerCantidades` ya acepta ambos.
 */

type ModuloOcr = {
  isSupported: boolean;
  extractTextFromImage: (uri: string) => Promise<string[]>;
};

let modulo: ModuloOcr | null | undefined;

function cargar(): ModuloOcr | null {
  if (modulo !== undefined) return modulo;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cargado = require('expo-text-extractor') as ModuloOcr;
    modulo = cargado.isSupported ? cargado : null;
  } catch {
    modulo = null; // Expo Go u otro entorno sin el modulo nativo
  }
  return modulo;
}

export function lecturaDisponible(): boolean {
  return cargar() !== null;
}

/** Texto reconocido en la imagen (archivo local). Lanza si el modulo no esta o la lectura falla. */
export async function leerTextoDeImagen(uri: string): Promise<string[]> {
  const m = cargar();
  if (!m) throw new Error('OCR no disponible');
  return m.extractTextFromImage(uri);
}
