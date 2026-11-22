import { useState } from 'react';
import { confirmar } from '@/lib/confirmar';
import { useSession } from '@/providers/SessionProvider';
import { borrarLocalDeUsuario, contarCambiosSinEnviar, sincronizarPendientes } from '@/services/dineroLocal';
import { MSG } from '@/validation/mensajes';

/**
 * Cerrar sesion. Antes de salir se intenta enviar lo guardado sin conexion. Si algo no llega, se avisa: al cerrar
 * sesion se borra la copia de este telefono (para que otra persona que use el telefono no la vea).
 */
export function useCerrarSesion() {
  const { signOut, user } = useSession();
  const [cerrando, setCerrando] = useState(false);

  const cerrarSesion = async () => {
    setCerrando(true);
    try {
      if (user) {
        await sincronizarPendientes(user.id).catch(() => undefined);
        const sinEnviar = await contarCambiosSinEnviar(user.id).catch(() => 0);
        if (sinEnviar > 0 && !(await confirmar('Cambios sin enviar', MSG.dinero.sinEnviar, 'Cerrar sesión'))) return;
        await borrarLocalDeUsuario(user.id).catch(() => undefined);
      }
      await signOut();
    } finally {
      setCerrando(false);
    }
  };

  return { cerrarSesion, cerrando };
}
