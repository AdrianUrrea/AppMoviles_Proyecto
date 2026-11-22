import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { normalizarUriLocal } from '@/documentos/logica';
import { asegurarPermiso } from '@/documentos/permisos';

export type Captura =
  | { estado: 'ok'; uri: string }
  | { estado: 'cancelado' }
  | { estado: 'sin_permiso'; puedePreguntar: boolean };

function aCaptura(resultado: ImagePicker.ImagePickerResult): Captura {
  const asset = resultado.canceled ? undefined : resultado.assets[0];
  if (!asset) return { estado: 'cancelado' };
  const uri = normalizarUriLocal(asset.uri);
  if (__DEV__ && uri !== asset.uri) console.warn('[camara] ruta corregida:', asset.uri, '->', uri);
  return { estado: 'ok', uri };
}

/**
 * Abre la camara del sistema. Pide permiso si hace falta: SIEMPRE lo pide cuando no esta concedido, aunque el sistema
 * diga que no se puede volver a preguntar (en Android "Preguntar siempre" se reporta asi). Ver `asegurarPermiso`.
 */
export async function tomarFoto(): Promise<Captura> {
  const permiso = await asegurarPermiso(ImagePicker.getCameraPermissionsAsync, ImagePicker.requestCameraPermissionsAsync);
  if (!permiso.concedido) return { estado: 'sin_permiso', puedePreguntar: permiso.puedePreguntar };
  const resultado = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1, // sin compresion aqui: se comprime una sola vez al preparar la imagen
    allowsEditing: false,
  });
  return aCaptura(resultado);
}

/** Selector de fotos del sistema (no requiere permiso en versiones recientes de iOS y Android). */
export async function elegirDeGaleria(): Promise<Captura> {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsMultipleSelection: false,
    allowsEditing: false,
  });
  return aCaptura(resultado);
}

/**
 * Android puede cerrar la app mientras la camara esta abierta (poca memoria). Al volver, la foto
 * tomada queda "pendiente" y esta funcion la recupera. En iOS siempre devuelve null.
 */
export async function recuperarCapturaPendiente(): Promise<Captura | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const pendiente = await ImagePicker.getPendingResultAsync();
    if (!pendiente || !('canceled' in pendiente)) return null;
    const captura = aCaptura(pendiente);
    return captura.estado === 'ok' ? captura : null;
  } catch {
    return null;
  }
}
