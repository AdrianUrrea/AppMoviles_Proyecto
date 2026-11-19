import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { FormTextField } from '@/components/form';
import { useSession } from '@/providers/SessionProvider';
import { AuthServiceError, signIn } from '@/services/auth';
import { AUTH_MESSAGES } from '@/validation/mensajes';
import { loginSchema } from '@/validation/login';
import type { LoginFormValues } from '@/validation/login';
import { colors, spacing, type } from '@/theme';

type LoginData = z.output<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { setPendingEmail } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<LoginFormValues, unknown, LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = async ({ correo, password }: LoginData) => {
    setFormError(null);
    try {
      await signIn(correo, password);
      // Con sesion iniciada, el guard de rutas lleva al dashboard.
    } catch (e) {
      if (e instanceof AuthServiceError && e.code === 'EMAIL_NOT_VERIFIED') {
        // signIn ya reenvio el codigo; llevar al usuario a confirmarlo.
        setPendingEmail(correo);
        router.push({ pathname: '/verify-email', params: { correo } });
        return;
      }
      setFormError(e instanceof AuthServiceError ? e.message : AUTH_MESSAGES.UNKNOWN);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Ingresa con tu correo y contraseña.</Text>
      </View>

      <FormTextField
        control={control}
        name="correo"
        label="Correo electrónico"
        placeholder="tucorreo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <FormTextField
        control={control}
        name="password"
        label="Contraseña"
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
      />

      <FormMessage message={formError} />

      <Button title="Iniciar sesión" onPress={handleSubmit(onSubmit)} />

      <View style={styles.separador}>
        <Text style={styles.separadorTexto}>¿Aún no tienes cuenta?</Text>
      </View>
      <Button title="Crear cuenta" variant="secondary" onPress={() => router.push('/register')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginTop: spacing.xl, marginBottom: spacing.sm },
  title: { ...type.title, color: colors.ink },
  subtitle: { ...type.body, color: colors.muted },
  separador: { alignItems: 'center', marginTop: spacing.sm },
  separadorTexto: { ...type.caption, color: colors.muted },
});
