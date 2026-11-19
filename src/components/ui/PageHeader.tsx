import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Props = { titulo: string; descripcion?: string; etiqueta?: string; children?: ReactNode };

/** Encabezado de una pantalla de detalle: etiqueta opcional, titulo, descripcion y, debajo, lo que se quiera agregar. */
export function PageHeader({ titulo, descripcion, etiqueta, children }: Props) {
  return (
    <View style={styles.cabecera}>
      {etiqueta ? (
        <View style={styles.etiqueta}>
          <Text style={styles.etiquetaTexto}>{etiqueta}</Text>
        </View>
      ) : null}
      <Text style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {descripcion ? <Text style={styles.descripcion}>{descripcion}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: { gap: spacing.sm },
  etiqueta: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.tint },
  etiquetaTexto: { ...type.caption, fontWeight: '600', color: colors.primary },
  titulo: { ...type.heading, color: colors.ink },
  descripcion: { ...type.body, color: colors.muted },
});
