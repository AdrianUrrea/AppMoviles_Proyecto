import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '@/theme';

/** Fila horizontal de Chip que llega hasta los bordes de la pantalla (el contenido empieza alineado con el resto). */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.fila}
      contentContainerStyle={styles.contenido}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Compensa el relleno horizontal de Screen (spacing.xl) para que el scroll llegue al borde.
  fila: { marginHorizontal: -spacing.xl, flexGrow: 0 },
  contenido: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
});
