/**
 * Lectura de texto de una foto (OCR) en el telefono: Google ML Kit en Android y Apple Vision en iOS, via
 * `expo-text-extractor`. La imagen NO sale del telefono.
 *
 * El modulo es nativo: NO existe en Expo Go, solo en una version de desarrollo o de produccion de la app
 * (`npx expo run:android` / `npx expo run:ios`, o una build de EAS). En Expo Go ni siquiera se carga la
 * libreria: la app sigue funcionando y simplemente oculta el boton.
 *
 * Android devuelve bloques de texto (pueden traer varios renglones) e iOS devuelve renglones;
 * `extraerCantidades` ya acepta ambos.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';

type ModuloOcr = {
  isSupported: boolean;
  extractTextFromImage: (uri: string) => Promise<string[]>;
};

let modulo: ModuloOcr | null = null;
let intentado = false;

function cargar(): ModuloOcr | null {
  if (intentado) return modulo;
  intentado = true;

  // Expo Go: el modulo nativo no existe, asi que no cargamos la libreria (evita el error y su log).
  
  if (!requireOptionalNativeModule('ExpoTextExtractor')) return null;

  try {
    modulo = require('expo-text-extractor') as ModuloOcr;
  } catch {
    modulo = null;
  }
  return modulo;
}

export function lecturaDisponible(): boolean {
  const m = cargar();
  return !!m && m.isSupported;
}

/** Texto reconocido en la imagen (archivo local). Lanza si el modulo no esta o la lectura falla. */
export async function leerTextoDeImagen(uri: string): Promise<string[]> {
  const m = cargar();
  if (!m) throw new Error('OCR no disponible');
  return m.extractTextFromImage(uri);
}