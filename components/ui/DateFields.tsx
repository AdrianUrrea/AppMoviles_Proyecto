import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  label: string;
  /** Valor inicial "YYYY-MM-DD" (opcional). */
  value?: string;
  /** Emite "YYYY-MM-DD" cuando esta completa, "" si esta vacia, o un texto incompleto (el esquema lo marca invalido). */
  onChange: (iso: string) => void;
  onBlur?: () => void;
  error?: string;
  helper?: string;
};

function compose(d: string, m: string, y: string): string {
  if (!d && !m && !y) return '';
  if (d && m && y) return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return `${y}-${m}-${d}`; // incompleta: no cumple el formato, el esquema mostrara "fecha invalida"
}

const soloDigitos = (t: string, max: number) => t.replace(/\D/g, '').slice(0, max);

type Campo = 'd' | 'm' | 'y';

/** Fecha de nacimiento en tres campos de texto: dia, mes y anio. */
export function DateFields({ label, value, onChange, onBlur, error, helper }: Props) {
  const inicial = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  const [d, setD] = useState(inicial?.[3] ?? '');
  const [m, setM] = useState(inicial?.[2] ?? '');
  const [y, setY] = useState(inicial?.[1] ?? '');
  const [foco, setFoco] = useState<Campo | null>(null);
  const mesRef = useRef<ComponentRef<typeof TextInput>>(null);
  const anioRef = useRef<ComponentRef<typeof TextInput>>(null);

  const message = error ?? helper;

  const cajaStyle = (campo: Campo) => [
    styles.caja,
    foco === campo && styles.cajaFoco,
    !!error && styles.cajaError,
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.fila}>
        <TextInput
          style={[...cajaStyle('d'), styles.input, styles.corto]}
          value={d}
          placeholder="DD"
          placeholderTextColor={colors.placeholder}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={`${label}: día`}
          onFocus={() => setFoco('d')}
          onBlur={() => setFoco(null)}
          onChangeText={(t) => {
            const v = soloDigitos(t, 2);
            setD(v);
            onChange(compose(v, m, y));
            if (v.length === 2) mesRef.current?.focus();
          }}
        />
        <TextInput
          ref={mesRef}
          style={[...cajaStyle('m'), styles.input, styles.corto]}
          value={m}
          placeholder="MM"
          placeholderTextColor={colors.placeholder}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={`${label}: mes`}
          onFocus={() => setFoco('m')}
          onBlur={() => setFoco(null)}
          onChangeText={(t) => {
            const v = soloDigitos(t, 2);
            setM(v);
            onChange(compose(d, v, y));
            if (v.length === 2) anioRef.current?.focus();
          }}
        />
        <TextInput
          ref={anioRef}
          style={[...cajaStyle('y'), styles.input, styles.largo]}
          value={y}
          placeholder="AAAA"
          placeholderTextColor={colors.placeholder}
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel={`${label}: año`}
          onFocus={() => setFoco('y')}
          onBlur={() => {
            setFoco(null);
            onBlur?.(); // se valida al salir del ultimo campo, no mientras se escribe
          }}
          onChangeText={(t) => {
            const v = soloDigitos(t, 4);
            setY(v);
            onChange(compose(d, m, v));
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
  fila: { flexDirection: 'row', gap: spacing.md },
  caja: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  cajaFoco: { borderColor: colors.focus, borderWidth: 2 },
  cajaError: { borderColor: colors.danger, borderWidth: 2 },
  input: { ...type.body, color: colors.ink, textAlign: 'center' },
  corto: { flex: 1 },
  largo: { flex: 1.6 },
  helper: { ...type.caption, color: colors.muted },
  error: { ...type.caption, color: colors.danger },
});
