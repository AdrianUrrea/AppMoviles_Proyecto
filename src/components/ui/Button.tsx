import { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, shadow, spacing, type } from '@/theme';

type Props = {
  title: string;
  /** Si devuelve una Promise, el boton queda bloqueado hasta que termine. */
  onPress: () => void | Promise<unknown>;
  variant?: 'primary' | 'secondary' | 'tonal' | 'text';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }: Props) {
  const lock = useRef(false); // evita doble toque antes de que React re-renderice
  const inactive = disabled || loading;

  const handlePress = () => {
    if (inactive || lock.current) return;
    const result = onPress();
    if (result instanceof Promise) {
      lock.current = true;
      result.catch(() => {}).finally(() => {
        lock.current = false;
      });
    }
  };

  const spinnerColor = variant === 'primary' ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      onPress={handlePress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'primary' && pressed && styles.primaryPressed,
        pressed && variant !== 'text' && styles.presionado,
        variant === 'secondary' && styles.secondary,
        variant === 'secondary' && pressed && styles.secondaryPressed,
        variant === 'tonal' && styles.tonal,
        variant === 'tonal' && pressed && styles.tonalPressed,
        variant === 'text' && styles.text,
        inactive && styles.inactive,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' ? styles.labelOnPrimary : styles.labelPrimary,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md + 2,
  },
  primary: { backgroundColor: colors.primary, ...shadow.raised },
  primaryPressed: { backgroundColor: colors.primaryPressed, shadowOpacity: 0.1, elevation: 1 },
  secondary: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  secondaryPressed: { backgroundColor: colors.tint },
  tonal: { backgroundColor: colors.tint },
  tonalPressed: { backgroundColor: colors.tintStrong },
  text: { backgroundColor: 'transparent', minHeight: 48 },
  presionado: { transform: [{ scale: 0.985 }] },
  inactive: { opacity: 0.45 },
  label: { ...type.body, fontWeight: '600', textAlign: 'center', letterSpacing: 0.1 },
  labelOnPrimary: { color: colors.onPrimary },
  labelPrimary: { color: colors.primary },
});
