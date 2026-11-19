import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import '@/config/calendarioLocale';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { useRecordatoriosRango } from '@/hooks/useRecordatorios';
import { claveDia, diasConRecordatorios } from '@/recordatorios/logica';
import { colors, spacing, type } from '@/theme';

const VENTANA_TOQUE_MS = 700;

type Mes = { y: number; m: number };

export default function CalendarioScreen() {
  const router = useRouter();
  const ultimoToque = useRef(0);
  const [mes, setMes] = useState<Mes>(() => {
    const hoy = new Date();
    return { y: hoy.getFullYear(), m: hoy.getMonth() + 1 };
  });

  const desdeMs = new Date(mes.y, mes.m - 1, 1).getTime();
  const hastaMs = new Date(mes.y, mes.m, 1).getTime();
  const { items, loading, error, recargar } = useRecordatoriosRango(desdeMs, hastaMs);

  const marcados = useMemo(() => {
    const out: Record<string, { marked: boolean; dotColor: string }> = {};
    for (const dia of diasConRecordatorios(items)) out[dia] = { marked: true, dotColor: colors.primary };
    return out;
  }, [items]);

  const abrirDia = (fecha: string) => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < VENTANA_TOQUE_MS) return; // doble toque
    ultimoToque.current = ahora;
    router.push({ pathname: '/calendario-dia', params: { fecha } });
  };

  return (
    <Screen conEncabezado>
      <Calendar
        current={claveDia(new Date(mes.y, mes.m - 1, 1))}
        firstDay={0}
        enableSwipeMonths
        markedDates={marcados}
        onDayPress={(d) => abrirDia(d.dateString)}
        onMonthChange={(m) => setMes({ y: m.year, m: m.month })}
        theme={{
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.muted,
          dayTextColor: colors.ink,
          textDisabledColor: colors.placeholder,
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          monthTextColor: colors.ink,
          dotColor: colors.primary,
          textMonthFontWeight: '700',
        }}
        style={styles.calendario}
      />

      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      {error ? (
        <View style={styles.errorBloque}>
          <FormMessage message={error} />
          <Button title="Reintentar" variant="secondary" loading={loading} onPress={recargar} />
        </View>
      ) : (
        <Text style={styles.ayuda}>Toca un día para ver o agendar recordatorios. Los puntos marcan días con recordatorios.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  calendario: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  errorBloque: { gap: spacing.md },
  ayuda: { ...type.caption, color: colors.muted, textAlign: 'center' },
});
