/**
 * Permisos del sistema (camara, notificaciones...). Logica pura: recibe las funciones del sistema como parametros.
 *
 * REGLA: nunca se deja de pedir un permiso solo porque el sistema diga `canAskAgain: false`.
 * En Android, "Preguntar siempre" (y otros estados) se reporta igual que "denegado para siempre": `canAskAgain` es
 * false aunque el sistema SI vaya a mostrar el cuadro de permiso. Si la app se fiara de ese dato mandaria siempre a
 * Ajustes y el usuario nunca podria conceder el permiso desde la app. Pedirlo es inofensivo: si de verdad esta
 * bloqueado, el sistema responde "denegado" al instante, sin mostrar nada, y entonces si se manda a Ajustes.
 */

export type EstadoPermiso = { granted: boolean; canAskAgain: boolean };

export type ResultadoPermiso =
  | { concedido: true }
  /** `puedePreguntar`: el sistema volveria a mostrar el cuadro si el usuario reintenta; false = hay que ir a Ajustes. */
  | { concedido: false; puedePreguntar: boolean };

export async function asegurarPermiso(
  obtener: () => Promise<EstadoPermiso>,
  pedir: () => Promise<EstadoPermiso>,
  forzarPedir: boolean = false,
): Promise<ResultadoPermiso> {
  if (!forzarPedir && (await obtener()).granted) return { concedido: true };
  const respuesta = await pedir();
  if (respuesta.granted) return { concedido: true };
  return { concedido: false, puedePreguntar: respuesta.canAskAgain };
}
