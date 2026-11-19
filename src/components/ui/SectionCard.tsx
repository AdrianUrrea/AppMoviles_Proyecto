import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, type } from '@/theme';

type Variante = 'principal' | 'normal' | 'fila';

type Props = {
  titulo: string;
  descripcion: string;
  icono: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  /** La tarjeta ocupa todo el ancho (funciona dentro de una cuadricula y de una columna). */
  anchoCompleto?: boolean;
  /**
   * 'principal': la accion mas importante de la pantalla (relleno de color).
   * 'normal': tarjeta de cuadricula con icono arriba.
   * 'fila': tarjeta horizontal compacta, para accesos secundarios.
   */
  variante?: Variante;
};

/** Tarjeta de acceso a una seccion. El texto crece con la fuente del sistema sin cortarse. */
export function SectionCard({ titulo, descripcion, icono, onPress, anchoCompleto = false, variante = 'normal' }: Props) {
  const horizontal = variante !== 'normal';
  const principal = variante === 'principal';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${descripcion}`}
      accessibilityHint="Abre la sección"
      style={({ pressed }) => [
        styles.card,
        horizontal ? styles.horizontal : styles.vertical,
        (anchoCompleto || horizontal) && styles.completo,
        principal && styles.principal,
        principal && pressed && styles.principalPresionada,
        !principal && pressed && styles.presionada,
      ]}
    >
      <View style={[styles.icono, principal && styles.iconoPrincipal]}>
        <Ionicons name={icono} size={variante === 'fila' ? 22 : 26} color={principal ? colors.onPrimary : colors.primary} />
      </View>
      <View style={horizontal ? styles.textoFila : styles.textoColumna}>
        <Text style={[styles.titulo, principal && styles.tituloPrincipal]}>{titulo}</Text>
        <Text style={[styles.descripcion, principal && styles.descripcionPrincipal]}>{descripcion}</Text>
      </View>
      {horizontal ? (
        <Ionicons name="chevron-forward" size={20} color={principal ? colors.onPrimary : colors.muted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.card,
  },
  vertical: { flexBasis: '47%', flexGrow: 1, minHeight: 128, padding: spacing.lg, gap: spacing.xs },
  horizontal: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  // Ancho completo con width y no con flexBasis: un porcentaje en flexBasis significaria "toda la altura" dentro de una columna.
  completo: { width: '100%' },
  presionada: { backgroundColor: colors.tint, borderColor: colors.primary },
  principal: { backgroundColor: colors.primary, borderColor: colors.primary, paddingVertical: spacing.xl },
  principalPresionada: { backgroundColor: colors.primaryPressed },
  icono: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tint,
  },
  iconoPrincipal: { width: 52, height: 52, backgroundColor: 'rgba(255,255,255,0.16)' },
  textoColumna: { gap: spacing.xs, marginTop: spacing.sm },
  textoFila: { flex: 1, gap: 2 },
  titulo: { ...type.label, fontSize: 16, lineHeight: 21, color: colors.ink },
  tituloPrincipal: { ...type.section, color: colors.onPrimary },
  descripcion: { ...type.caption, color: colors.muted },
  descripcionPrincipal: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.88)' },
});
