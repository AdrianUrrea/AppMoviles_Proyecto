import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { confirmar } from '@/lib/confirmar';
import { formatearFechaHoraLarga } from '@/recordatorios/logica';
import { useSession } from '@/providers/SessionProvider';
import { borrarLocalDeUsuario, contarCambiosSinEnviar, sincronizarPendientes } from '@/services/dineroLocal';
import { diagnosticarNotificaciones, pedirPermiso, programarAvisoDePrueba } from '@/services/notificaciones';
import { MSG } from '@/validation/mensajes';
import { colors, radius, spacing, type } from '@/theme';

export default function ConfiguracionScreen() {
  const { signOut, user } = useSession();
  const [cerrando, setCerrando] = useState(false);

  // Antes de salir se intenta enviar lo guardado sin conexion. Si algo no llega, se avisa: al cerrar sesion
  // se borra la copia de este telefono (para que otra persona que use el telefono no la vea).
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

  return (
    <Screen conEncabezado>
      <View style={styles.fila} accessibilityState={{ disabled: true }}>
        <Text style={styles.filaTitulo}>Cambiar contraseña</Text>
        <Text style={styles.filaEstado}>Próximamente</Text>
      </View>

      <Button title="Cerrar sesión" variant="secondary" loading={cerrando} onPress={cerrarSesion} />

      {__DEV__ ? <DiagnosticoNotificaciones /> : null}
    </Screen>
  );
}

/** Solo se ve al desarrollar (no existe en una app publicada). */
function DiagnosticoNotificaciones() {
  const [texto, setTexto] = useState<string | null>(null);

  const ver = async () => {
    try {
      const d = await diagnosticarNotificaciones();
      const lineas = [
        `Disponibles: ${d.disponible ? 'sí' : 'no'}`,
        `Permiso: ${d.permiso ? 'sí' : 'no'}`,
        `Alarma exacta (Android 12+): ${d.alarmaExacta}`,
        `Avisos programados: ${d.programadas.length}`,
        ...d.programadas.map((p) => `• ${p.cuando ? formatearFechaHoraLarga(p.cuando) : 'sin fecha'}  (${p.id.slice(0, 8)})`),
      ];
      setTexto(lineas.join('\n'));
    } catch (e) {
      setTexto(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const probar = async () => {
    try {
      if ((await pedirPermiso()) !== 'concedido') {
        setTexto('Sin permiso de notificaciones (o no disponibles).');
        return;
      }
      const cuando = await programarAvisoDePrueba(30);
      setTexto(`Aviso programado para las ${cuando.toLocaleTimeString()}.\nBloquea la pantalla y espera. Anota a qué hora llega.`);
    } catch (e) {
      setTexto(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <View style={styles.diag}>
      <Text style={styles.diagTitulo}>Diagnóstico de notificaciones (solo desarrollo)</Text>
      <Button title="Ver estado" variant="secondary" onPress={ver} />
      <Button title="Aviso de prueba en 30 segundos" variant="secondary" onPress={probar} />
      {texto ? <Text style={styles.diagTexto}>{texto}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.7,
  },
  filaTitulo: { ...type.body, color: colors.ink, flexShrink: 1 },
  filaEstado: { ...type.caption, color: colors.muted },
  diag: { gap: spacing.md, marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border },
  diagTitulo: { ...type.label, color: colors.muted },
  diagTexto: { ...type.body, color: colors.ink },
});
