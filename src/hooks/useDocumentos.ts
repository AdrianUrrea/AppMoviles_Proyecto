import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDocumentoErrorMessage, listarDocumentos, obtenerDocumento, urlsFirmadas } from '@/services/documentos';
import type { Documento } from '@/documentos/logica';

/** Lista de documentos con sus miniaturas. Se recarga cada vez que la pantalla recupera el foco. */
export function useDocumentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setLoading(true);
      setError(null);
      (async () => {
        try {
          const docs = await listarDocumentos();
          // Las miniaturas son opcionales: si fallan, la lista se muestra igual.
          const enlaces = await urlsFirmadas(docs.map((d) => d.ruta)).catch(() => ({}) as Record<string, string>);
          if (!activo) return;
          setDocumentos(docs);
          setUrls(enlaces);
        } catch (e) {
          if (activo) setError(getDocumentoErrorMessage(e));
        } finally {
          if (activo) setLoading(false);
        }
      })();
      return () => {
        activo = false;
      };
      // `version` fuerza la recarga manual
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version]),
  );

  return { documentos, urls, loading, error, recargar };
}

/** Un documento y su enlace temporal de imagen. */
export function useDocumento(id: string) {
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const doc = await obtenerDocumento(id);
        const enlaces = await urlsFirmadas([doc.ruta]);
        if (!activo) return;
        setDocumento(doc);
        setUrl(enlaces[doc.ruta] ?? null);
      } catch (e) {
        if (activo) setError(getDocumentoErrorMessage(e));
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [id, version]);

  return { documento, url, loading, error, recargar };
}
