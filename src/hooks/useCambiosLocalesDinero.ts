import { useEffect, useState } from 'react';
import type { ResumenLocal } from '@/dinero/local';
import { useSession } from '@/providers/SessionProvider';
import { resumenesLocales, suscribirCambiosLocales } from '@/services/dineroLocal';

/** Formularios con algo guardado solo en este telefono (borrador o pendiente de enviar). Se actualiza solo. */
export function useCambiosLocalesDinero(): { resumenes: ResumenLocal[]; listo: boolean } {
  const { user } = useSession();
  const uid = user?.id ?? null;
  const [resumenes, setResumenes] = useState<ResumenLocal[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let activo = true;
    const cargar = () => {
      resumenesLocales(uid)
        .then((r) => {
          if (!activo) return;
          setResumenes(r);
          setListo(true);
        })
        .catch(() => {
          if (activo) setListo(true);
        });
    };
    cargar();
    const baja = suscribirCambiosLocales(cargar);
    return () => {
      activo = false;
      baja();
    };
  }, [uid]);

  return { resumenes, listo };
}
