import * as Clipboard from 'expo-clipboard';

/** Copia texto al portapapeles. Devuelve false si el sistema no lo permitio. */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(texto);
    return true;
  } catch {
    return false;
  }
}
