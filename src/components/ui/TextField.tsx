import { forwardRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useVerCampoEnfocado } from '@/components/ui/teclado';
import { colors, radius, spacing, type } from '@/theme';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  /** Mensaje de error. Si existe, reemplaza al texto de ayuda. */
  error?: string;
  helper?: string;
  /** Campo de contrasena con boton Mostrar/Ocultar. */
  secure?: boolean;
};

/**
 * Compatible con react-hook-form:
 * <Controller render={({ field }) => (
 *   <TextField label="Correo" value={field.value} onChangeText={field.onChange}
 *              onBlur={field.onBlur} error={errors.correo?.message} ref={field.ref} />
 * )} />
 */
export const TextField = forwardRef<ComponentRef<typeof TextInput>, Props>(function TextField(
  { label, error, helper, secure = false, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);
  const verCampoEnfocado = useVerCampoEnfocado();
  const message = error ?? helper;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.row, focused && styles.rowFocused, !!error && styles.rowError]}>
        <TextInput
          {...inputProps}
          ref={ref}
          style={styles.input}
          secureTextEntry={hidden}
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={label}
          accessibilityHint={error}
          onFocus={(e) => {
            setFocused(true);
            verCampoEnfocado();
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
          >
            <Text style={styles.toggle}>{hidden ? 'Mostrar' : 'Ocultar'}</Text>
          </Pressable>
        ) : null}
      </View>

      {message ? (
        <Text
          style={error ? styles.error : styles.helper}
          accessibilityLiveRegion="polite"
          accessibilityRole={error ? 'alert' : undefined}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...type.label, color: colors.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  rowFocused: { borderColor: colors.focus, borderWidth: 2 },
  rowError: { borderColor: colors.danger, borderWidth: 2 },
  input: { flex: 1, ...type.body, color: colors.ink, paddingVertical: spacing.sm },
  toggle: { ...type.label, color: colors.primary },
  helper: { ...type.caption, color: colors.muted },
  error: { ...type.caption, color: colors.danger },
});
