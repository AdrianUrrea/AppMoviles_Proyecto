import { useEffect } from 'react';
import { AppState } from 'react-native';
import { listarFuturos } from '@/services/recordatorios';
import { sincronizarNotificaciones } from '@/services/notificaciones';

/**
 * Reprograma los avisos del telefono desde Supabase: al iniciar sesion, al abrir la app y al volver a ella.
 * Cubre telefono nuevo, reinstalacion y recordatorios eliminados desde otro dispositivo.
 */
export function useSincronizarRecordatorios() {
  useEffect(() => {
    let activo = true;

    const sincronizar = async () => {
      try {
        const futuros = await listarFuturos(new Date());
        if (activo) await sincronizarNotificaciones(futuros);
      } catch {
        // Sin red u otro fallo: se reintenta la proxima vez que la app pase a primer plano.
      }
    };

    void sincronizar();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void sincronizar();
    });

    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, []);
}
