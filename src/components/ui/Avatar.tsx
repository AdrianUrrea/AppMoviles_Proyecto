import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme';

/** Circulo con las iniciales de la persona. Decorativo: el nombre ya se lee al lado. */
export function Avatar({ iniciales, tamano = 72 }: { iniciales: string; tamano?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circulo, { width: tamano, height: tamano, borderRadius: tamano / 2 }]}
    >
      <Text style={[styles.texto, { fontSize: tamano * 0.38 }]}>{iniciales}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  texto: { ...type.title, color: colors.onPrimary, lineHeight: undefined },
});
