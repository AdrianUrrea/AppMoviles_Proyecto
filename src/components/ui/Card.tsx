import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  /** 'tint' para destacar (atajos, avisos); 'normal' para el contenido. */
  variante?: 'normal' | 'tint';
  /** Quita el relleno interno (para listas que ya traen el suyo en cada fila). */
  sinRelleno?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Contenedor base: agrupa contenido relacionado sobre el fondo de la pantalla. */
export function Card({ children, variante = 'normal', sinRelleno = false, style }: Props) {
  return (
    <View style={[styles.card, variante === 'tint' && styles.tint, !sinRelleno && styles.relleno, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadow.card,
  },
  tint: { backgroundColor: colors.tint, borderColor: colors.tintStrong, shadowOpacity: 0, elevation: 0 },
  relleno: { padding: spacing.lg, gap: spacing.md },
});
