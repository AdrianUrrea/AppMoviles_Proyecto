import { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  title: string;
  /** Si devuelve una Promise, el boton queda bloqueado hasta que termine. */
  onPress: () => void | Promise<unknown>;
  variant?: 'primary' | 'secondary' | 'text';
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
        variant === 'secondary' && styles.secondary,
        variant === 'secondary' && pressed && styles.secondaryPressed,
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
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
  secondaryPressed: { backgroundColor: '#E6EEEA' },
  text: { backgroundColor: 'transparent' },
  inactive: { opacity: 0.5 },
  label: { ...type.body, fontWeight: '600' },
  labelOnPrimary: { color: colors.onPrimary },
  labelPrimary: { color: colors.primary },
});
