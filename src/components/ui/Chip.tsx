import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  titulo: string;
  seleccionado: boolean;
  onPress: () => void;
  /** Texto para lectores de pantalla si debe ser distinto al visible. */
  accessibilityLabel?: string;
  /** Punto que avisa que hay algo pendiente en esta opcion. */
  conAviso?: boolean;
};

/** Opcion de un filtro o selector horizontal (categorias, ejercicios, meses). */
export function Chip({ titulo, seleccionado, onPress, accessibilityLabel, conAviso = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado }}
      accessibilityLabel={accessibilityLabel ?? titulo}
      style={[styles.chip, seleccionado && styles.activo]}
    >
      <Text style={[styles.texto, seleccionado && styles.textoActivo]}>
        {titulo}
        {conAviso ? ' •' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activo: { backgroundColor: colors.primary, borderColor: colors.primary },
  texto: { ...type.label, color: colors.ink },
  textoActivo: { color: colors.onPrimary },
});
