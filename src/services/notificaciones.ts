import { Platform } from 'react-native';
import { claveDia, diferenciaSync, formatearFechaHoraLarga } from '@/recordatorios/logica';
import type { Recordatorio } from '@/recordatorios/logica';

type ModuloNotificaciones = typeof import('expo-notifications');
type Respuesta = import('expo-notifications').NotificationResponse;

/**
 * expo-notifications se carga de forma PROTEGIDA. En algunos entornos (por ejemplo Expo Go para Android)
 * faltan modulos nativos y el simple `import` lanza un error que tumba toda la app. Aqui, si eso pasa,
 * las notificaciones quedan desactivadas pero el resto de la app (calendario, recordatorios) sigue funcionando.
 */
function cargarModulo(): ModuloNotificaciones | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as ModuloNotificaciones;
  } catch (e) {
    if (__DEV__) {
      console.warn('[notificaciones] No disponibles en este entorno:', e instanceof Error ? e.message : e);
    }
    return null;
  }
}

const Notifications = cargarModulo();

/** false si el entorno no soporta notificaciones (p. ej. Expo Go en Android). */
export const notificacionesDisponibles = Notifications !== null;

const CANAL = 'recordatorios';

/** Llamar una vez al iniciar la app: muestra los avisos aunque la app este abierta y crea el canal de Android. */
export function configurarNotificaciones(): void {
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      // Android 13+ exige que el canal exista antes de pedir el permiso.
      void Notifications.setNotificationChannelAsync(CANAL, {
        name: 'Recordatorios',
        importance: Notifications.AndroidImportance.HIGH,
      }).catch(() => undefined);
    }
  } catch {
    // Entorno parcialmente compatible: se sigue sin notificaciones.
  }
}

export type EstadoPermiso = 'concedido' | 'denegado' | 'no_disponible';

export async function tienePermiso(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Pide permiso si hace falta. Si el usuario ya lo nego de forma definitiva, no vuelve a preguntar. */
export async function pedirPermiso(): Promise<EstadoPermiso> {
  if (!Notifications) return 'no_disponible';
  try {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return 'concedido';
    if (!actual.canAskAgain) return 'denegado';
    const respuesta = await Notifications.requestPermissionsAsync();
    return respuesta.granted ? 'concedido' : 'denegado';
  } catch {
    return 'no_disponible';
  }
}

/** Programa el aviso del dia del recordatorio. Usa el id del recordatorio como identificador para poder cancelarlo. */
export async function programarRecordatorio(r: Recordatorio): Promise<void> {
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    identifier: r.id,
    content: {
      title: 'Recordatorio',
      body: r.titulo,
      sound: true,
      data: { fecha: claveDia(r.fechaHora), recordatorioId: r.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.fechaHora, channelId: CANAL },
  });
}

/** Aviso inmediato de confirmacion al agendar. */
export async function avisoDeAgendado(r: Recordatorio): Promise<void> {
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio agendado',
      body: `${r.titulo} · ${formatearFechaHoraLarga(r.fechaHora)}`,
      data: { fecha: claveDia(r.fechaHora) },
    },
    trigger: { channelId: CANAL },
  });
}

export async function cancelarRecordatorio(id: string): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

/** Al cerrar sesion: ese telefono no debe recibir avisos de la cuenta anterior. */
export async function cancelarTodasLasNotificaciones(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // sin permiso o sin soporte: no hay nada que cancelar
  }
}

/** Deja programados exactamente los proximos recordatorios. Es idempotente y segura de repetir. */
export async function sincronizarNotificaciones(futuros: readonly Recordatorio[], ahora = new Date()): Promise<void> {
  const modulo = Notifications;
  if (!modulo || !(await tienePermiso())) return;
  const programadas = await modulo.getAllScheduledNotificationsAsync();
  const { programar, cancelar } = diferenciaSync(
    futuros,
    programadas.map((n) => n.identifier),
    ahora,
  );
  await Promise.all(cancelar.map((id) => modulo.cancelScheduledNotificationAsync(id)));
  for (const r of programar) await programarRecordatorio(r);
}

const sinRespuesta = (): Respuesta | null | undefined => null;

/** Ultima notificacion que el usuario toco (tambien si abrio la app). null si no hay o no hay soporte. */
export const useUltimaRespuestaNotificacion: () => Respuesta | null | undefined = Notifications
  ? Notifications.useLastNotificationResponse
  : sinRespuesta;

/** true si la respuesta es un toque normal sobre la notificacion (no un boton de accion). */
export function esToqueEnNotificacion(respuesta: Respuesta): boolean {
  return !!Notifications && respuesta.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER;
}

// ---------------------------------------------------------------------------
// Diagnostico (solo desarrollo): para entender por que un aviso programado no llega.
// ---------------------------------------------------------------------------

export type DiagnosticoNotificaciones = {
  disponible: boolean;
  permiso: boolean;
  /** Solo Android 12+: sin este permiso el sistema puede retrasar los avisos programados. */
  alarmaExacta: 'concedida' | 'denegada' | 'desconocida';
  programadas: { id: string; cuando: Date | null }[];
};

function cuandoDe(trigger: unknown): Date | null {
  const t = trigger as { value?: unknown; date?: unknown } | null;
  const v = t?.value ?? t?.date;
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v < 1e11 ? v * 1000 : v); // segundos o milisegundos
  return null;
}

export async function diagnosticarNotificaciones(): Promise<DiagnosticoNotificaciones> {
  if (!Notifications) return { disponible: false, permiso: false, alarmaExacta: 'desconocida', programadas: [] };
  const permiso = await tienePermiso();
  let alarmaExacta: DiagnosticoNotificaciones['alarmaExacta'] = 'desconocida';
  try {
    alarmaExacta = (await Notifications.getExactAlarmPermissionsAsync()).granted ? 'concedida' : 'denegada';
  } catch {
    // iOS u otro entorno sin esa API
  }
  const lista = await Notifications.getAllScheduledNotificationsAsync();
  return {
    disponible: true,
    permiso,
    alarmaExacta,
    programadas: lista.map((n) => ({ id: n.identifier, cuando: cuandoDe(n.trigger) })),
  };
}

/** Programa un aviso de prueba para dentro de `segundos`. Devuelve la hora exacta a la que debe llegar. */
export async function programarAvisoDePrueba(segundos: number): Promise<Date> {
  if (!Notifications) throw new Error('Notificaciones no disponibles en este entorno.');
  const cuando = new Date(Date.now() + segundos * 1000);
  await Notifications.scheduleNotificationAsync({
    identifier: 'prueba-diagnostico',
    content: { title: 'Prueba de aviso programado', body: `Debía llegar a las ${cuando.toLocaleTimeString()}` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: cuando, channelId: CANAL },
  });
  return cuando;
}
