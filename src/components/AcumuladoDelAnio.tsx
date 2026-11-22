import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { listaDeMeses } from '@/dinero/acumulado';
import { formatearMonto } from '@/dinero/montos';
import { useAcumuladoEjercicio } from '@/hooks/useAcumuladoEjercicio';
import { MSG } from '@/validation/mensajes';
import { colors, spacing, type } from '@/theme';

/**
 * "Lo que llevas en 2026": suma de las declaraciones mensuales ya guardadas del año. Se muestra en el formulario
 * mensual para que se vea como crece lo que luego llenara la declaracion anual. Si aun no hay nada, no se muestra.
 */
export function AcumuladoDelAnio({ ejercicio }: { ejercicio: string }) {
  const { acumulado } = useAcumuladoEjercicio(ejercicio);
  if (!acumulado || acumulado.mesesCapturados.length === 0) return null;

  const n = acumulado.mesesCapturados.length;
  return (
    <Card variante="tint">
      <View style={styles.bloque}>
        <Text style={styles.titulo}>Lo que llevas en {ejercicio}</Text>
        <Text style={styles.nota}>
          {n} {n === 1 ? 'mes guardado' : 'meses guardados'}: {listaDeMeses(acumulado.mesesCapturados)}.
        </Text>
        {acumulado.totales.map((t) => (
          <View key={t.mensual} style={styles.fila}>
            <Text style={styles.etiqueta}>{t.etiqueta}</Text>
            <Text style={styles.valor}>{formatearMonto(t.centavos)}</Text>
          </View>
        ))}
        <Text style={styles.nota}>{MSG.dinero.mensualesNota}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: spacing.sm },
  titulo: { ...type.label, fontSize: 16, color: colors.ink },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  etiqueta: { ...type.body, color: colors.ink, flex: 1 },
  valor: { ...type.label, fontSize: 16, color: colors.ink },
  nota: { ...type.caption, color: colors.muted },
});
