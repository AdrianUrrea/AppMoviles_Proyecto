import { Platform } from 'react-native';
import { asegurarPermiso } from '@/documentos/permisos';
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

/**
 * Pide permiso si hace falta. Lo pide aunque el sistema diga que no se puede volver a preguntar (ese dato no es fiable
 * en Android); si de verdad esta bloqueado, responde "denegado" al instante. Ver `asegurarPermiso`.
 */
export async function pedirPermiso(): Promise<EstadoPermiso> {
  if (!Notifications) return 'no_disponible';
  const sistema = Notifications;
  try {
    const resultado = await asegurarPermiso(
      () => sistema.getPermissionsAsync(),
      () => sistema.requestPermissionsAsync(),
    );
    return resultado.concedido ? 'concedido' : 'denegado';
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
