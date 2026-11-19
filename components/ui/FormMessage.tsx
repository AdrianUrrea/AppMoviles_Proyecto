import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Props = { message?: string | null; tone?: 'error' | 'info' };

/** Mensaje a nivel de formulario (errores del servidor, avisos). No renderiza nada si no hay mensaje. */
export function FormMessage({ message, tone = 'error' }: Props) {
  if (!message) return null;
  const isError = tone === 'error';
  return (
    <View
      style={[styles.box, isError ? styles.errorBox : styles.infoBox]}
      accessibilityRole={isError ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: isError ? colors.danger : colors.primary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.md, borderRadius: radius.sm, borderLeftWidth: 4 },
  errorBox: { backgroundColor: '#FBEAE8', borderLeftColor: colors.danger },
  infoBox: { backgroundColor: '#E6EEEA', borderLeftColor: colors.primary },
  text: { ...type.body },
});
