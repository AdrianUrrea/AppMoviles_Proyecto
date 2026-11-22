import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '@/components/form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormMessage } from '@/components/ui/FormMessage';
import { Note } from '@/components/ui/Note';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { useSession } from '@/providers/SessionProvider';
import { changePassword, getErrorMessage } from '@/services/auth';
import { AUTH_MESSAGES, MSG } from '@/validation/mensajes';
import { crearCambioPasswordSchema } from '@/validation/password';
import type { CambioPasswordFormValues } from '@/validation/password';
import { spacing } from '@/theme';

export default function PerfilPasswordScreen() {
  const router = useRouter();
  const { user } = useSession();
  const correo = user?.email ?? '';
  const schema = useMemo(() => crearCambioPasswordSchema(correo), [correo]);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<CambioPasswordFormValues, unknown, CambioPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { actual: '', nueva: '', confirmar: '' },
    mode: 'onBlur',
  });

  const volver = (cambiada: boolean) =>
    router.dismissTo({ pathname: '/perfil', params: cambiada ? { contrasena: '1' } : {} });

  const guardar = async ({ actual, nueva }: CambioPasswordFormValues) => {
    setErrorGuardar(null);
    if (!correo) {
      setErrorGuardar(AUTH_MESSAGES.UNKNOWN);
      return;
    }
    try {
      await changePassword(correo, actual, nueva);
      volver(true);
    } catch (e) {
      setErrorGuardar(getErrorMessage(e)); // el formulario conserva lo escrito
    }
  };

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      <PageHeader titulo="Cambiar contraseña" descripcion="Elige una contraseña nueva para tu cuenta." />
      <Note texto={MSG.perfil.contrasenaAviso} icono="lock-closed-outline" />

      <Card>
        <FormTextField
          control={control}
          name="actual"
          label="Contraseña actual"
          secure
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
        />
        <FormTextField
          control={control}
          name="nueva"
          label="Contraseña nueva"
          helper="Mínimo 8 caracteres."
          secure
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <FormTextField
          control={control}
          name="confirmar"
          label="Confirma la contraseña nueva"
          secure
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
        />
      </Card>

      <View style={styles.bloque}>
        <FormMessage message={errorGuardar} />
        <Button title="Cambiar contraseña" loading={formState.isSubmitting} onPress={handleSubmit(guardar)} />
        <Button title="Cancelar" variant="text" onPress={() => volver(false)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ bloque: { gap: spacing.md } });
