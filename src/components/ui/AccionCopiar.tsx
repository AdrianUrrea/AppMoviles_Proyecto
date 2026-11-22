import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '@/theme';

/**
 * Indicador de accion al final de una fila que se copia con un toque: "Copiar" y, ya copiado, "Copiado" en verde.
 * Es solo visual: la fila entera es el boton y ya trae su propia etiqueta para los lectores de pantalla.
 */
export function AccionCopiar({ copiado }: { copiado: boolean }) {
  return (
    <View
      style={[styles.pildora, copiado && styles.copiada]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name={copiado ? 'checkmark' : 'copy-outline'} size={16} color={copiado ? colors.success : colors.primary} />
      <Text style={[styles.texto, copiado && styles.textoCopiado]}>{copiado ? 'Copiado' : 'Copiar'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 92, // "Copiar" y "Copiado" miden lo mismo: la fila no salta al copiar
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    borderRadius: radius.pill,
    backgroundColor: colors.tint,
  },
  copiada: { backgroundColor: colors.successTint },
  texto: { ...type.label, color: colors.primary },
  textoCopiado: { color: colors.success },
});
