import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '@/theme';

/** Aviso fijo y discreto (contexto o consejo). Para errores y resultados de acciones usa FormMessage. */
export function Note({ texto, icono = 'information-circle-outline' }: { texto: string; icono?: 'information-circle-outline' | 'lock-closed-outline' | 'bulb-outline' }) {
  return (
    <View style={styles.nota}>
      <Ionicons name={icono} size={20} color={colors.primary} style={styles.icono} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  nota: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.tint },
  icono: { marginTop: 1 },
  texto: { ...type.caption, fontSize: 14, lineHeight: 20, color: colors.ink, flex: 1 },
});
