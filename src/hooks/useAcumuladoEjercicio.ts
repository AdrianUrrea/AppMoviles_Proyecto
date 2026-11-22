import { useCallback, useEffect, useRef, useState } from 'react';
import { acumularEjercicio, combinarMensuales } from '@/dinero/acumulado';
import type { Acumulado, RegistroMensual } from '@/dinero/acumulado';
import { sanearValores } from '@/dinero/formularios';
import { logDev } from '@/lib/log';
import { useSession } from '@/providers/SessionProvider';
import { listarCapturasMensuales } from '@/services/datosDinero';
import { leerMensualesLocales, suscribirCambiosLocales } from '@/services/dineroLocal';

/** Espera tras un cambio en el telefono antes de volver a sumar (los borradores se guardan al teclear). */
const ESPERA_RECALCULO_MS = 600;

/**
 * Suma de las declaraciones mensuales guardadas de un ejercicio (telefono + cuenta).
 *  - Lo del telefono manda (puede tener cambios aun sin enviar); la cuenta completa los meses que el telefono no tiene.
 *  - Sin conexion funciona con lo que hay en el telefono (`sinConexion` avisa que podria faltar algo).
 *  - Se actualiza sola cuando el usuario guarda una declaracion mensual.
 */
export function useAcumuladoEjercicio(ejercicio: string) {
  const { user } = useSession();
  const uid = user?.id ?? null;
  const [acumulado, setAcumulado] = useState<Acumulado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [sinConexion, setSinConexion] = useState(false);
  const [version, setVersion] = useState(0);
  const remotos = useRef<RegistroMensual[]>([]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // Carga completa: telefono + cuenta.
  useEffect(() => {
    if (!uid) return;
    let activo = true;
    setCargando(true);
    (async () => {
      let locales: RegistroMensual[] = [];
      try {
        locales = await leerMensualesLocales(uid, ejercicio);
      } catch (e) {
        logDev('acumulado-local', e);
      }
      let sin = false;
      try {
        const filas = await listarCapturasMensuales(ejercicio);
        remotos.current = filas.map((f) => ({ periodo: f.periodo, valores: sanearValores('mensual', f.datos) }));
      } catch (e) {
        logDev('acumulado-remoto', e);
        sin = true;
        remotos.current = [];
      }
      if (!activo) return;
      setAcumulado(acumularEjercicio(ejercicio, combinarMensuales(locales, remotos.current), new Date()));
      setSinConexion(sin);
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, [uid, ejercicio, version]);

  // Cambios en el telefono: se vuelve a sumar solo lo local (sin ir a la red) con lo ya traido de la cuenta.
  useEffect(() => {
    if (!uid) return;
    let activo = true;
    let espera: ReturnType<typeof setTimeout> | null = null;
    const recalcular = () => {
      leerMensualesLocales(uid, ejercicio)
        .then((locales) => {
          if (activo) setAcumulado(acumularEjercicio(ejercicio, combinarMensuales(locales, remotos.current), new Date()));
        })
        .catch((e) => logDev('acumulado-local', e));
    };
    const baja = suscribirCambiosLocales(() => {
      if (espera) clearTimeout(espera);
      espera = setTimeout(recalcular, ESPERA_RECALCULO_MS);
    });
    return () => {
      activo = false;
      if (espera) clearTimeout(espera);
      baja();
    };
  }, [uid, ejercicio]);

  return { acumulado, cargando, sinConexion, recargar };
}
