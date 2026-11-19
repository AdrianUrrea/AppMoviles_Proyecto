import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';

export type Perfil = { nombre: string; apellido_paterno: string };

const TIEMPO_LIMITE_MS = 20_000;

/**
 * Carga el perfil del usuario (tabla usuario). Las politicas RLS limitan el acceso a su propia fila.
 * `error` es true si fallo la consulta (sin red, timeout, servidor); no lo es si simplemente no hay fila.
 */
export function useProfile(userId: string | undefined) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const { data, error: dbError } = await withTimeout(
          supabase.from('usuario').select('nombre, apellido_paterno').eq('id_user', userId).maybeSingle(),
          TIEMPO_LIMITE_MS,
          () => new Error('timeout'),
        );
        if (!active) return;
        if (dbError) {
          setPerfil(null);
          setError(true);
        } else {
          setPerfil((data as Perfil | null) ?? null);
        }
      } catch {
        if (active) {
          setPerfil(null);
          setError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { perfil, loading, error, reintentar };
}
