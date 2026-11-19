import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSession } from '@/providers/SessionProvider';
import { sincronizarPendientes } from '@/services/dineroLocal';

/**
 * Envia a la cuenta los datos de dinero que se guardaron sin conexion: al abrir la app y cada vez que vuelve
 * a primer plano. Si algo no se pudo enviar, el servicio reintenta solo cada minuto mientras la app siga abierta.
 */
export function useSincronizarDinero() {
  const { user } = useSession();
  const uid = user?.id ?? null;

  useEffect(() => {
    if (!uid) return;
    let activo = true;
    const sincronizar = () => {
      if (activo) void sincronizarPendientes(uid).catch(() => undefined);
    };
    sincronizar();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') sincronizar();
    });
    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, [uid]);
}
