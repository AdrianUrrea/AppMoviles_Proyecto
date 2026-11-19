import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Opcion<T extends string> = { id: T; titulo: string };
type Props<T extends string> = { opciones: readonly Opcion<T>[]; valor: T; onChange: (id: T) => void };

/** Selector de 2 o 3 vistas de la misma pantalla (por ejemplo, Capturar y Copiar). */
export function SegmentedControl<T extends string>({ opciones, valor, onChange }: Props<T>) {
  return (
    <View style={styles.pista} accessibilityRole="tablist">
      {opciones.map((o) => {
        const activa = o.id === valor;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            style={[styles.opcion, activa && styles.activa]}
          >
            <Text style={[styles.texto, activa && styles.textoActivo]}>{o.titulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pista: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: radius.md, backgroundColor: colors.tint },
  opcion: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingHorizontal: spacing.md },
  activa: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  texto: { ...type.label, color: colors.muted },
  textoActivo: { color: colors.primary },
});
