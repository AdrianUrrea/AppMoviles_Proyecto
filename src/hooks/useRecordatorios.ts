import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getRecordatorioErrorMessage, listarRecordatorios } from '@/services/recordatorios';
import type { Recordatorio } from '@/recordatorios/logica';

/**
 * Recordatorios en [desdeMs, hastaMs). Se recargan cada vez que la pantalla vuelve a tener foco
 * (por ejemplo, al regresar del detalle de un dia).
 */
export function useRecordatoriosRango(desdeMs: number, hastaMs: number) {
  const [items, setItems] = useState<Recordatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setLoading(true);
      setError(null);
      listarRecordatorios(new Date(desdeMs), new Date(hastaMs))
        .then((r) => {
          if (activo) setItems(r);
        })
        .catch((e) => {
          if (activo) setError(getRecordatorioErrorMessage(e));
        })
        .finally(() => {
          if (activo) setLoading(false);
        });
      return () => {
        activo = false;
      };
      // `version` fuerza la recarga manual
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [desdeMs, hastaMs, version]),
  );

  return { items, loading, error, recargar };
}
