import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  label: string;
  /** Valor inicial "HH:MM" (opcional). */
  value?: string;
  /** Emite "HH:MM" cuando esta completa, "" si esta vacia, o un texto incompleto (el esquema lo marca invalido). */
  onChange: (hora: string) => void;
  onBlur?: () => void;
  error?: string;
  helper?: string;
};

function compose(h: string, m: string): string {
  if (!h && !m) return '';
  if (h && m) return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  return `${h}:${m}`;
}

const soloDigitos = (t: string) => t.replace(/\D/g, '').slice(0, 2);

/** Hora en dos campos de texto (hora y minuto, formato de 24 h). */
export function TimeFields({ label, value, onChange, onBlur, error, helper }: Props) {
  const inicial = /^(\d{2}):(\d{2})$/.exec(value ?? '');
  const [h, setH] = useState(inicial?.[1] ?? '');
  const [m, setM] = useState(inicial?.[2] ?? '');
  const [foco, setFoco] = useState<'h' | 'm' | null>(null);
  const minutoRef = useRef<ComponentRef<typeof TextInput>>(null);
  const message = error ?? helper;

  const caja = (campo: 'h' | 'm') => [
    styles.caja,
    foco === campo && styles.cajaFoco,
    !!error && styles.cajaError,
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.fila}>
        <TextInput
          style={[...caja('h'), styles.input]}
          value={h}
          placeholder="HH"
          placeholderTextColor={colors.placeholder}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={`${label}: hora`}
          onFocus={() => setFoco('h')}
          onBlur={() => setFoco(null)}
          onChangeText={(t) => {
            const v = soloDigitos(t);
            setH(v);
            onChange(compose(v, m));
            if (v.length === 2) minutoRef.current?.focus();
          }}
        />
        <Text style={styles.separador}>:</Text>
        <TextInput
          ref={minutoRef}
          style={[...caja('m'), styles.input]}
          value={m}
          placeholder="MM"
          placeholderTextColor={colors.placeholder}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={`${label}: minutos`}
          onFocus={() => setFoco('m')}
          onBlur={() => {
            setFoco(null);
            onBlur?.(); // se valida al salir del ultimo campo
          }}
          onChangeText={(t) => {
            const v = soloDigitos(t);
            setM(v);
            onChange(compose(h, v));
          }}
        />
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
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...type.label, color: colors.ink },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  caja: {
    minHeight: 48,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  cajaFoco: { borderColor: colors.focus, borderWidth: 2 },
  cajaError: { borderColor: colors.danger, borderWidth: 2 },
  input: { ...type.body, color: colors.ink, textAlign: 'center' },
  separador: { ...type.title, color: colors.ink },
  helper: { ...type.caption, color: colors.muted },
  error: { ...type.caption, color: colors.danger },
});
