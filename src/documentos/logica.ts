import { MESES_CORTOS } from '../recordatorios/nombres';

export type Documento = {
  id: string;
  nombre: string;
  ruta: string;
  tamano: number;
  creadoEn: Date;
};

export type FilaDocumento = {
  id_documento: string;
  nombre: string;
  ruta_archivo: string;
  tamano_bytes: number;
  created_at: string;
};

/** Lado mas largo de la imagen que se sube. Suficiente para leer un documento y mucho mas liviano que la foto original. */
export const LADO_MAXIMO_PX = 1600;
export const CALIDAD_JPEG = 0.8;
/** Debe coincidir con el limite del bucket y de la tabla en supabase/005_documentos.sql. */
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

/**
 * En Expo Go (Android) la carpeta de cache se llama literalmente "%40anonymous%2FProyecto-<id>", con
 * simbolos "%" en el nombre. La libreria de camara devuelve esa ruta SIN escapar, y Android decodifica
 * "%40" como "@" y "%2F" como "/" al abrir el archivo: busca una carpeta que no existe (ENOENT).
 * Escapar cada "%" como "%25" hace que la decodificacion devuelva el nombre real.
 *
 * Solo actua sobre rutas de Expo Go (contienen /ExperienceData/) y es idempotente (si ya hay "%25",
 * no hace nada). En una app instalada la ruta no tiene "%" y se devuelve igual.
 */
export function normalizarUriLocal(uri: string): string {
  if (!uri.includes('/ExperienceData/') || uri.includes('%25')) return uri;
  return uri.replace(/%/g, '%25');
}

export function filaADocumento(f: FilaDocumento): Documento {
  return {
    id: f.id_documento,
    nombre: f.nombre,
    ruta: f.ruta_archivo,
    tamano: f.tamano_bytes,
    creadoEn: new Date(f.created_at),
  };
}

/** Ajuste de tamano necesario, o null si la imagen ya es suficientemente pequena (nunca se agranda). */
export function dimensionesObjetivo(
  ancho: number,
  alto: number,
  maximo: number = LADO_MAXIMO_PX,
): { width: number } | { height: number } | null {
  if (!Number.isFinite(ancho) || !Number.isFinite(alto) || ancho <= 0 || alto <= 0) return null;
  if (Math.max(ancho, alto) <= maximo) return null;
  return ancho >= alto ? { width: maximo } : { height: maximo };
}

/** Ruta dentro del bucket: SIEMPRE bajo la carpeta del usuario. El nombre real del archivo nunca forma parte de la ruta. */
export function construirRuta(userId: string, uuid: string): string {
  return `${userId}/${uuid}.jpg`;
}

export function formatearFechaCorta(d: Date): string {
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Nombre por defecto del documento: "Documento 24 oct 2026". */
export function nombreSugerido(ahora: Date): string {
  return `Documento ${formatearFechaCorta(ahora)}`;
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Texto de la fila que despliega la lista de documentos dentro de un tramite ("3 documentos guardados..."). */
export function resumenDeDocumentos(cantidad: number, abierta: boolean): string {
  if (cantidad <= 0) return 'Aún no tienes documentos guardados';
  const guardados = cantidad === 1 ? '1 documento guardado' : `${cantidad} documentos guardados`;
  if (abierta) return `${guardados} · toca para ocultar`;
  return `${guardados} · toca para ${cantidad === 1 ? 'verlo' : 'verlos'}`;
}
