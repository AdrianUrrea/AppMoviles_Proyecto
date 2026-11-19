import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  titulo: string;
  descripcion?: string;
  /** Linea pequena sobre el titulo (por ejemplo la categoria). */
  etiqueta?: string;
  icono?: ComponentProps<typeof Ionicons>['name'];
  /** Reemplaza al icono (por ejemplo, una miniatura). */
  izquierda?: ReactNode;
  /** Icono de la derecha. Por defecto, una flecha. */
  derecha?: ComponentProps<typeof Ionicons>['name'] | null;
  onPress: () => void;
  accessibilityHint?: string;
};

/** Fila tocable para usar dentro de GroupedList: icono opcional, titulo, descripcion y flecha. */
export function ListRow({ titulo, descripcion, etiqueta, icono, izquierda, derecha = 'chevron-forward', onPress, accessibilityHint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={descripcion ? `${titulo}. ${descripcion}` : titulo}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
    >
      {izquierda ??
        (icono ? (
          <View style={styles.icono}>
            <Ionicons name={icono} size={22} color={colors.primary} />
          </View>
        ) : null)}
      <View style={styles.texto}>
        {etiqueta ? <Text style={styles.etiqueta}>{etiqueta}</Text> : null}
        <Text style={styles.titulo}>{titulo}</Text>
        {descripcion ? <Text style={styles.descripcion}>{descripcion}</Text> : null}
      </View>
      {derecha ? <Ionicons name={derecha} size={20} color={colors.muted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 56 },
  presionada: { backgroundColor: colors.tint },
  icono: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint },
  texto: { flex: 1, gap: 2 },
  etiqueta: { ...type.caption, color: colors.primary, fontWeight: '600' },
  titulo: { ...type.label, fontSize: 16, lineHeight: 21, color: colors.ink },
  descripcion: { ...type.caption, color: colors.muted },
});
