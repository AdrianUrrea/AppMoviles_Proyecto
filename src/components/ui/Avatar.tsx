import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme';

/**
 * Circulo con las iniciales de la persona. Decorativo: el nombre ya se lee al lado.
 * `invertido`: para ponerlo sobre un fondo del color de marca (circulo claro, letras de marca).
 */
export function Avatar({ iniciales, tamano = 72, invertido = false }: { iniciales: string; tamano?: number; invertido?: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circulo, invertido && styles.circuloInvertido, { width: tamano, height: tamano, borderRadius: tamano / 2 }]}
    >
      <Text style={[styles.texto, invertido && styles.textoInvertido, { fontSize: tamano * 0.38 }]}>{iniciales}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  circuloInvertido: { backgroundColor: colors.surface },
  texto: { ...type.title, color: colors.onPrimary, lineHeight: undefined },
  textoInvertido: { color: colors.primary },
});
