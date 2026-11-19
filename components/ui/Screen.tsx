import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  /** false para pantallas cortas que no necesitan scroll (login, dashboard). */
  scroll?: boolean;
  /** true si la pantalla ya tiene encabezado nativo (evita duplicar el margen superior). */
  conEncabezado?: boolean;
};

/** Contenedor de pantalla: area segura + teclado que no tapa campos + scroll opcional. */
export function Screen({ children, scroll = true, conEncabezado = false }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={conEncabezado ? ['left', 'right', 'bottom'] : undefined}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.flex]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
});
