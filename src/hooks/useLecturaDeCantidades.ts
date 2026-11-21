import { useState } from 'react';
import { extraerCantidades } from '@/documentos/cantidades';
import type { CantidadEncontrada } from '@/documentos/cantidades';
import { esErrorDeRed } from '@/lib/errores';
import { logDev } from '@/lib/log';
import { leerTextoDeImagen } from '@/services/ocr';
import { DOCUMENTO_MESSAGES, MSG } from '@/validation/mensajes';

/** Imagen local lista para leer. `limpiar` borra el archivo temporal si hubo que descargarlo. */
export type ImagenParaLeer = { uri: string; limpiar?: () => void };

type Opciones = {
  /** Lectura previa (por ejemplo, guardada en memoria) para no leer otra vez el mismo documento. */
  inicial?: CantidadEncontrada[] | null;
  /** Se llama con cada lectura nueva, para que quien use el hook pueda guardarla. */
  alLeer?: (cantidades: CantidadEncontrada[]) => void;
};

/**
 * Lee una imagen en el telefono (OCR) y extrae montos y fechas. La imagen temporal se borra siempre al terminar.
 * Quien lo usa decide CUANDO leer llamando a `leer`: la lectura nunca arranca sola.
 */
export function useLecturaDeCantidades(obtenerImagen: () => Promise<ImagenParaLeer>, { inicial = null, alLeer }: Opciones = {}) {
  const [leyendo, setLeyendo] = useState(false);
  const [cantidades, setCantidades] = useState<CantidadEncontrada[] | null>(inicial);
  const [lecturas, setLecturas] = useState(0); // reinicia las marcas de "copiado" en cada lectura nueva
  const [error, setError] = useState<string | null>(null);

  const leer = async () => {
    setError(null);
    setLeyendo(true);
    let imagen: ImagenParaLeer | null = null;
    try {
      imagen = await obtenerImagen();
      const texto = await leerTextoDeImagen(imagen.uri);
      const encontradas = extraerCantidades(texto);
      setCantidades(encontradas);
      setLecturas((n) => n + 1);
      alLeer?.(encontradas);
    } catch (e) {
      logDev('lectura-cantidades', e);
      setError(esErrorDeRed(e) ? DOCUMENTO_MESSAGES.NETWORK : MSG.documento.lectura.error);
    } finally {
      imagen?.limpiar?.();
      setLeyendo(false);
    }
  };

  return { cantidades, leyendo, error, lecturas, leer };
}
