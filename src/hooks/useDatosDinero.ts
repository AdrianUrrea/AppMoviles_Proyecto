import { useCallback, useEffect, useRef, useState } from 'react';
import { claveDe, sanearValores, valoresVacios } from '@/dinero/formularios';
import type { TipoDato, Valores } from '@/dinero/formularios';
import { REGISTRO_VACIO, conBorrador, conGuardado, igualesValores, valoresIniciales } from '@/dinero/local';
import { logDev } from '@/lib/log';
import { useSession } from '@/providers/SessionProvider';
import { DineroError, getDineroErrorMessage, obtenerCaptura } from '@/services/datosDinero';
import {
  actualizarRegistroLocal,
  leerRegistroLocal,
  sincronizarPendientes,
  suscribirCambiosLocales,
} from '@/services/dineroLocal';

/** 'enviado': ya esta en la cuenta. 'local': guardado en el telefono, se enviara cuando haya conexion. */
export type ResultadoGuardado = 'enviado' | 'local';

/**
 * Datos de dinero de un tipo y periodo, con copia en el telefono:
 *  - abre con lo que hay en el telefono (borrador sin guardar > ultimo guardado) aunque no haya conexion;
 *  - si hay conexion, se pone al dia con la cuenta (sin pisar lo que el usuario ya empezo a escribir);
 *  - "guardar" siempre guarda primero en el telefono y despues intenta enviar.
 */
export function useDatosDinero(tipo: TipoDato, periodo: string) {
  const { user } = useSession();
  const uid = user?.id ?? null;
  const clave = claveDe(tipo, periodo);

  /** Lo ya guardado (alimenta la "Lista para copiar"). */
  const [valores, setValores] = useState<Valores>(() => valoresVacios(tipo));
  /** Con lo que arranca el formulario. */
  const [iniciales, setIniciales] = useState<Valores>(() => valoresVacios(tipo));
  const [versionForm, setVersionForm] = useState(0);
  const [restaurado, setRestaurado] = useState(false);
  const [pendiente, setPendiente] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const editado = useRef(false);
  const inicialesRef = useRef(iniciales);
  inicialesRef.current = iniciales;

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!uid) return;
    let activo = true;
    editado.current = false;
    setLoading(true);
    setError(null);
    setSinConexion(false);

    (async () => {
      // 1) Lo que hay en el telefono: es inmediato y no necesita red.
      let local = REGISTRO_VACIO;
      try {
        local = await leerRegistroLocal(uid, clave, tipo);
      } catch (e) {
        logDev('dinero-local', e);
      }
      if (!activo) return;
      const ini = valoresIniciales(tipo, local);
      setIniciales(ini.valores);
      setRestaurado(ini.restaurado);
      setValores(sanearValores(tipo, local.guardado));
      setPendiente(local.pendiente);
      setVersionForm((v) => v + 1);

      const hayLocal = local.guardado !== null || local.borrador !== null;
      if (hayLocal) setLoading(false);

      // 2) Con cambios pendientes manda el telefono: se envian en vez de bajar la copia de la cuenta.
      if (local.pendiente) {
        setLoading(false);
        void sincronizarPendientes(uid).catch(() => undefined);
        return;
      }

      // 3) Ponerse al dia con la cuenta.
      try {
        const crudo = await obtenerCaptura(clave);
        if (!activo) return;
        const remoto = crudo === null ? null : sanearValores(tipo, crudo);
        const nuevo = await actualizarRegistroLocal(uid, clave, tipo, (r) =>
          r.pendiente || igualesValores(r.guardado, remoto) ? r : { ...r, guardado: remoto },
        );
        if (!activo) return;
        setValores(sanearValores(tipo, nuevo.guardado));
        // Solo se reemplaza lo que ve el usuario si aun no ha tocado nada y no hay un borrador que respetar.
        if (!editado.current && nuevo.borrador === null && !igualesValores(local.guardado, nuevo.guardado)) {
          setIniciales(nuevo.guardado ?? valoresVacios(tipo));
          setVersionForm((v) => v + 1);
        }
      } catch (e) {
        if (!activo) return;
        if (e instanceof DineroError && e.code === 'NETWORK') setSinConexion(true);
        else if (!hayLocal) setError(getDineroErrorMessage(e));
      } finally {
        if (activo) setLoading(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [uid, clave, tipo, version]);

  // Cuando termina una sincronizacion (o cambia algo en el telefono) se refresca el aviso de "pendiente".
  useEffect(() => {
    if (!uid) return;
    let activo = true;
    const refrescar = () => {
      leerRegistroLocal(uid, clave, tipo)
        .then((r) => {
          if (activo) setPendiente(r.pendiente);
        })
        .catch(() => undefined);
    };
    const baja = suscribirCambiosLocales(refrescar);
    return () => {
      activo = false;
      baja();
    };
  }, [uid, clave, tipo]);

  /** Guarda lo escrito (sin validar) para poder reabrir el formulario donde se quedo. */
  const guardarBorrador = useCallback(
    async (v: Valores): Promise<void> => {
      if (!uid) return;
      if (!igualesValores(v, inicialesRef.current)) editado.current = true;
      try {
        await actualizarRegistroLocal(uid, clave, tipo, (r) => conBorrador(r, tipo, v, Date.now()));
      } catch (e) {
        logDev('dinero-borrador', e); // un fallo aqui no debe estorbar al usuario mientras escribe
      }
    },
    [uid, clave, tipo],
  );

  const guardar = useCallback(
    async (nuevos: Valores): Promise<ResultadoGuardado> => {
      if (!uid) throw new DineroError('UNKNOWN');
      try {
        // Primero al telefono: asi nada se pierde aunque se cierre la app a medio envio.
        await actualizarRegistroLocal(uid, clave, tipo, () => conGuardado(tipo, nuevos, Date.now()));
      } catch (e) {
        logDev('dinero-local', e);
        throw new DineroError('UNKNOWN');
      }
      setValores(sanearValores(tipo, nuevos));
      setRestaurado(false);
      setPendiente(true);
      await sincronizarPendientes(uid).catch(() => undefined);
      const despues = await leerRegistroLocal(uid, clave, tipo).catch(() => null);
      const sigue = despues ? despues.pendiente : true;
      setPendiente(sigue);
      return sigue ? 'local' : 'enviado';
    },
    [uid, clave, tipo],
  );

  return {
    clave,
    valores,
    iniciales,
    versionForm,
    restaurado,
    pendiente,
    sinConexion,
    loading,
    error,
    recargar,
    guardar,
    guardarBorrador,
  };
}
