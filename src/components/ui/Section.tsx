import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '@/theme';

type Props = {
  titulo: string;
  /** Una linea que explica que hacer en esta seccion. */
  ayuda?: string;
  /** Elemento a la derecha del titulo (por ejemplo, un contador). */
  derecha?: ReactNode;
  children: ReactNode;
};

/** Seccion de una pantalla: titulo, ayuda opcional y contenido con espaciado uniforme. */
export function Section({ titulo, ayuda, derecha, children }: Props) {
  return (
    <View style={styles.seccion}>
      <View style={styles.cabecera}>
        <View style={styles.titulos}>
          <Text style={styles.titulo} accessibilityRole="header">
            {titulo}
          </Text>
          {ayuda ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
        </View>
        {derecha}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: spacing.md },
  cabecera: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  titulos: { flex: 1, gap: 2 },
  titulo: { ...type.section, color: colors.ink },
  ayuda: { ...type.caption, color: colors.muted },
});
