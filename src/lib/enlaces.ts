import { Linking } from 'react-native';
import { esEnlaceSatSeguro } from '@/tramites/logica';

export type ResultadoEnlace = 'abierto' | 'no_seguro' | 'error';

/** Abre un enlace en el navegador SOLO si es una direccion https oficial del SAT. */
export async function abrirEnlaceSat(url: string): Promise<ResultadoEnlace> {
  if (!esEnlaceSatSeguro(url)) return 'no_seguro';
  try {
    await Linking.openURL(url);
    return 'abierto';
  } catch {
    return 'error';
  }
}
