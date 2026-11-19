import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  titulo: string;
  descripcion: string;
  icono: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  anchoCompleto?: boolean;
};

/** Tarjeta de acceso a una seccion. El texto crece con la fuente del sistema sin cortarse. */
export function SectionCard({ titulo, descripcion, icono, onPress, anchoCompleto = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${descripcion}`}
      accessibilityHint="Abre la sección"
      style={({ pressed }) => [styles.card, anchoCompleto && styles.completo, pressed && styles.presionada]}
    >
      <View style={styles.icono}>
        <Ionicons name={icono} size={26} color={colors.primary} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descripcion}>{descripcion}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 140,
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completo: { flexBasis: '100%', minHeight: 0 },
  presionada: { backgroundColor: '#E6EEEA', borderColor: colors.primary },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6EEEA',
  },
  titulo: { ...type.label, fontSize: 16, lineHeight: 21, color: colors.ink },
  descripcion: { ...type.caption, color: colors.muted },
});
