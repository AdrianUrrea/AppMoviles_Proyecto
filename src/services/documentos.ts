import { randomUUID } from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { esErrorDeRed } from '@/lib/errores';
import { logDev } from '@/lib/log';
import { withTimeout } from '@/lib/timeout';
import { construirRuta, filaADocumento } from '@/documentos/logica';
import type { Documento, FilaDocumento } from '@/documentos/logica';
import { DOCUMENTO_MESSAGES } from '@/validation/mensajes';
import type { DocumentoErrorCode } from '@/validation/mensajes';

const BUCKET = 'documentos';
const COLUMNAS = 'id_documento, nombre, ruta_archivo, tamano_bytes, created_at';
const LIMITE_CONSULTA_MS = 20_000;
const LIMITE_SUBIDA_MS = 60_000;
const VIGENCIA_ENLACE_SEG = 3600;

export class DocumentoError extends Error {
  constructor(public readonly code: DocumentoErrorCode) {
    super(DOCUMENTO_MESSAGES[code]);
    this.name = 'DocumentoError';
  }
}

export function getDocumentoErrorMessage(error: unknown): string {
  return error instanceof DocumentoError ? error.message : DOCUMENTO_MESSAGES.UNKNOWN;
}

const limite = <T,>(llamada: PromiseLike<T>, ms = LIMITE_CONSULTA_MS): Promise<T> =>
  withTimeout(llamada, ms, () => new DocumentoError('NETWORK'));

function aDocumentoError(error: unknown): DocumentoError {
  if (error instanceof DocumentoError) return error;
  logDev('documentos', error);
  if (esErrorDeRed(error)) return new DocumentoError('NETWORK');
  const mensaje = String((error as { message?: unknown } | null)?.message ?? '');
  if (/exceeded|too large|payload too large|413/i.test(mensaje)) return new DocumentoError('TOO_LARGE');
  return new DocumentoError('UNKNOWN');
}

export async function listarDocumentos(): Promise<Documento[]> {
  try {
    const { data, error } = await limite(
      supabase.from('documento').select(COLUMNAS).order('created_at', { ascending: false }).limit(200),
    );
    if (error) throw error;
    return ((data as FilaDocumento[] | null) ?? []).map(filaADocumento);
  } catch (e) {
    throw aDocumentoError(e);
  }
}

export async function obtenerDocumento(id: string): Promise<Documento> {
  try {
    const { data, error } = await limite(
      supabase.from('documento').select(COLUMNAS).eq('id_documento', id).maybeSingle(),
    );
    if (error) throw error;
    if (!data) throw new DocumentoError('NOT_FOUND');
    return filaADocumento(data as FilaDocumento);
  } catch (e) {
    throw aDocumentoError(e);
  }
}

/** Enlaces temporales para ver las imagenes (el bucket es privado). Devuelve { ruta: url }. */
export async function urlsFirmadas(rutas: readonly string[]): Promise<Record<string, string>> {
  if (rutas.length === 0) return {};
  try {
    const { data, error } = await limite(
      supabase.storage.from(BUCKET).createSignedUrls([...rutas], VIGENCIA_ENLACE_SEG),
    );
    if (error) throw error;
    const salida: Record<string, string> = {};
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) salida[item.path] = item.signedUrl;
    }
    return salida;
  } catch (e) {
    throw aDocumentoError(e);
  }
}

/**
 * Sube la imagen y crea el registro. Si el registro falla, borra el archivo recien subido
 * para no dejar archivos huerfanos.
 */
export async function subirDocumento(datos: {
  userId: string;
  nombre: string;
  bytes: ArrayBuffer;
  tamano: number;
}): Promise<Documento> {
  const ruta = construirRuta(datos.userId, randomUUID());
  try {
    const subida = await limite(
      supabase.storage.from(BUCKET).upload(ruta, datos.bytes, { contentType: 'image/jpeg', upsert: false }),
      LIMITE_SUBIDA_MS,
    );
    if (subida.error) throw subida.error;

    try {
      const { data, error } = await limite(
        supabase
          .from('documento')
          .insert({ nombre: datos.nombre, ruta_archivo: ruta, tamano_bytes: datos.tamano })
          .select(COLUMNAS)
          .single(),
      );
      if (error) throw error;
      return filaADocumento(data as FilaDocumento);
    } catch (e) {
      await supabase.storage.from(BUCKET).remove([ruta]).catch(() => undefined);
      throw e;
    }
  } catch (e) {
    throw aDocumentoError(e);
  }
}

/**
 * Elimina primero el ARCHIVO y despues el registro. Asi, si algo falla a medias, el usuario sigue
 * viendo el documento y puede reintentar: nunca queda un archivo "eliminado" que sigue guardado.
 */
export async function eliminarDocumento(documento: Documento): Promise<void> {
  try {
    const archivo = await limite(supabase.storage.from(BUCKET).remove([documento.ruta]));
    if (archivo.error) throw archivo.error;

    const { error } = await limite(supabase.from('documento').delete().eq('id_documento', documento.id));
    if (error) throw error;
  } catch (e) {
    throw aDocumentoError(e);
  }
}
