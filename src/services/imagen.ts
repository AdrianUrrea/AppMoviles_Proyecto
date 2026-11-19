import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { CALIDAD_JPEG, dimensionesObjetivo, normalizarUriLocal } from '@/documentos/logica';

export type ImagenPreparada = {
  /** Archivo temporal ya comprimido (para borrarlo despues de subirlo). */
  uri: string;
  bytes: ArrayBuffer;
  tamano: number;
};

/**
 * Convierte la foto en un JPEG liviano: respeta la orientacion, reduce el lado mas largo a LADO_MAXIMO_PX
 * (sin agrandar nunca) y comprime. Una foto de camara de varios MB queda en unos cientos de KB.
 */
export async function prepararImagen(uriOriginal: string): Promise<ImagenPreparada> {
  const uri = normalizarUriLocal(uriOriginal); // idempotente: ver normalizarUriLocal
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const objetivo = dimensionesObjetivo(original.width, original.height);
  const lista = objetivo ? await ImageManipulator.manipulate(original).resize(objetivo).renderAsync() : original;
  const resultado = await lista.saveAsync({ compress: CALIDAD_JPEG, format: SaveFormat.JPEG });

  const uriResultado = normalizarUriLocal(resultado.uri);
  const bytes = await new File(uriResultado).arrayBuffer();
  return { uri: uriResultado, bytes, tamano: bytes.byteLength };
}

/** Borra un archivo temporal. Nunca falla: si no se puede, el sistema lo limpia despues. */
export function borrarTemporal(uri: string): void {
  try {
    new File(uri).delete();
  } catch {
    // nada que hacer
  }
}
