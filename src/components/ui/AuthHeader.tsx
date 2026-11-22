import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '@/theme';

type Props = { titulo: string; subtitulo?: ReactNode };

/** Encabezado de las pantallas de acceso (iniciar sesion, registro, confirmar correo): marca, titulo y explicacion. */
export function AuthHeader({ titulo, subtitulo }: Props) {
  return (
    <View style={styles.cabecera}>
      <View style={styles.marca} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="document-text" size={28} color={colors.onPrimary} />
      </View>
      <Text style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: { gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm },
  marca: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  titulo: { ...type.title, color: colors.ink },
  subtitulo: { ...type.body, color: colors.muted },
});
