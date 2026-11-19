import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  error?: string;
};

export function Checkbox({ checked, onChange, label, error }: Props) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        style={styles.row}
        hitSlop={6}
      >
        <View style={[styles.box, checked && styles.boxChecked, !!error && styles.boxError]}>
          {checked ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  box: {
    width: 24,
    height: 24,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxError: { borderColor: colors.danger, borderWidth: 2 },
  check: { color: colors.onPrimary, fontSize: 16, lineHeight: 18, fontWeight: '700' },
  label: { ...type.body, color: colors.ink, flex: 1 },
  error: { ...type.caption, color: colors.danger },
});
