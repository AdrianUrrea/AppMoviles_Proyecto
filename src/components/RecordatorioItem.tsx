import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { formatearHora } from '@/recordatorios/logica';
import type { Recordatorio } from '@/recordatorios/logica';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  recordatorio: Recordatorio;
  /** Si devuelve una Promise, el boton queda bloqueado hasta que termine (evita doble eliminacion). */
  onEliminar: () => void | Promise<unknown>;
  eliminando?: boolean;
};

export function RecordatorioItem({ recordatorio, onEliminar, eliminando = false }: Props) {
  return (
    <View style={styles.fila}>
      <Text style={styles.hora}>{formatearHora(recordatorio.fechaHora)}</Text>
      <Text style={styles.titulo} numberOfLines={3}>
        {recordatorio.titulo}
      </Text>
      <Button title="Eliminar" variant="text" loading={eliminando} onPress={onEliminar} />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hora: { ...type.label, fontSize: 16, color: colors.primary },
  titulo: { ...type.body, color: colors.ink, flex: 1 },
});
