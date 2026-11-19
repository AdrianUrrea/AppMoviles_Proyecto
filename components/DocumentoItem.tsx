import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatearFechaCorta, formatearTamano } from '@/documentos/logica';
import type { Documento } from '@/documentos/logica';
import { colors, radius, spacing, type } from '@/theme';

type Props = { documento: Documento; miniaturaUrl?: string; onPress: () => void };

export function DocumentoItem({ documento, miniaturaUrl, onPress }: Props) {
  const fecha = formatearFechaCorta(documento.creadoEn);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${documento.nombre}, ${fecha}`}
      accessibilityHint="Abre el documento"
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
    >
      {miniaturaUrl ? (
        <Image source={{ uri: miniaturaUrl }} style={styles.miniatura} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.miniatura, styles.sinMiniatura]}>
          <Ionicons name="document-outline" size={26} color={colors.primary} />
        </View>
      )}
      <View style={styles.texto}>
        <Text style={styles.nombre} numberOfLines={2}>
          {documento.nombre}
        </Text>
        <Text style={styles.meta}>
          {fecha} · {formatearTamano(documento.tamano)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presionada: { backgroundColor: '#E6EEEA', borderColor: colors.primary },
  miniatura: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: '#E6EEEA' },
  sinMiniatura: { alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1, gap: spacing.xs },
  nombre: { ...type.label, fontSize: 16, lineHeight: 21, color: colors.ink },
  meta: { ...type.caption, color: colors.muted },
});
