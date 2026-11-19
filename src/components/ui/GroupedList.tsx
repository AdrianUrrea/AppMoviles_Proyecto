import { Children } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/theme';

/** Lista de filas dentro de una sola tarjeta, separadas por una linea fina. Cada hijo es una fila. */
export function GroupedList({ children }: { children: ReactNode }) {
  const filas = Children.toArray(children).filter(Boolean);
  return (
    <Card sinRelleno>
      {filas.map((fila, i) => (
        <View key={i}>
          {i > 0 ? <View style={styles.separador} /> : null}
          {fila}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({ separador: { height: 1, backgroundColor: colors.divider } });
