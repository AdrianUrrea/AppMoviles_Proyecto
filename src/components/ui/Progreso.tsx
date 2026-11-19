import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Props = { hechos: number; total: number; /** Palabra para el texto: "copiados", "listos". */ etiqueta: string };

/** "2 de 5 copiados" con una barra fina. */
export function Progreso({ hechos, total, etiqueta }: Props) {
  const parte = total > 0 ? Math.min(1, hechos / total) : 0;
  return (
    <View style={styles.contenedor} accessibilityLiveRegion="polite">
      <Text style={styles.texto}>
        {hechos} de {total} {etiqueta}
      </Text>
      <View style={styles.pista}>
        <View style={[styles.relleno, { width: `${parte * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: spacing.xs },
  texto: { ...type.caption, color: colors.muted },
  pista: { height: 4, borderRadius: radius.pill, backgroundColor: colors.divider, overflow: 'hidden' },
  relleno: { height: 4, borderRadius: radius.pill, backgroundColor: colors.primary },
});
