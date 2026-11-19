import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SECCIONES } from '@/config/secciones';
import type { SeccionId } from '@/config/secciones';
import { colors, spacing, type } from '@/theme';

/** Pantalla provisional de una seccion. Se reemplaza cuando se construya el feature de esa seccion. */
export function ProximamenteScreen({ id }: { id: SeccionId }) {
  const seccion = SECCIONES.find((s) => s.id === id);
  if (!seccion) return null;

  return (
    <Screen scroll={false} conEncabezado>
      <View style={styles.centro}>
        <View style={styles.icono}>
          <Ionicons name={seccion.icono} size={36} color={colors.primary} />
        </View>
        <Text style={styles.titulo}>{seccion.titulo}</Text>
        <Text style={styles.mensaje}>Esta sección estará disponible pronto.</Text>
        <Text style={styles.descripcion}>{seccion.descripcion}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  icono: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6EEEA',
  },
  titulo: { ...type.title, color: colors.ink, textAlign: 'center' },
  mensaje: { ...type.body, color: colors.ink, textAlign: 'center' },
  descripcion: { ...type.caption, color: colors.muted, textAlign: 'center' },
});
