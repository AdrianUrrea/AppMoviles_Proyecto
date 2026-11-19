import { useCallback, useEffect, useState } from 'react';
import { getPerfilErrorMessage, obtenerPerfilCompleto } from '@/services/perfil';
import type { FilaPerfil } from '@/tramites/logica';

/** Perfil completo del usuario (para precargar datos en los tramites), con error y reintento. */
export function usePerfilCompleto() {
  const [perfil, setPerfil] = useState<FilaPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const reintentar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    setError(null);
    obtenerPerfilCompleto()
      .then((p) => {
        if (activo) setPerfil(p);
      })
      .catch((e) => {
        if (activo) setError(getPerfilErrorMessage(e));
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, [version]);

  return { perfil, loading, error, reintentar };
}
