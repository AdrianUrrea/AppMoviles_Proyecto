import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { FormCheckbox, FormDateField, FormTextField } from '@/components/form';
import { useSession } from '@/providers/SessionProvider';
import { AuthServiceError, register } from '@/services/auth';
import { AUTH_MESSAGES } from '@/validation/mensajes';
import { REGISTRO_DEFAULTS, registroSchema } from '@/validation/registro';
import type { RegistroData, RegistroFormValues } from '@/validation/registro';
import { colors, spacing, type } from '@/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { setPendingEmail } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, setError } = useForm<RegistroFormValues, unknown, RegistroData>({
    resolver: zodResolver(registroSchema),
    defaultValues: REGISTRO_DEFAULTS,
    mode: 'onBlur',
  });

  const onSubmit = async (d: RegistroData) => {
    setFormError(null);
    try {
      const { correo } = await register({
        correo: d.correo,
        password: d.password,
        nombre: d.nombre,
        apellidoPaterno: d.apellidoPaterno,
        apellidoMaterno: d.apellidoMaterno || undefined,
        nacimiento: d.nacimiento,
        rfc: d.rfc,
        calle: d.calle,
        numExt: d.numExt,
        numInt: d.numInt || undefined,
        colonia: d.colonia,
        cp: d.cp,
        municipio: d.municipio,
        estado: d.estado,
        aceptoPrivacidad: d.aceptoPrivacidad,
      });
      // push (no replace): desde la pantalla de confirmacion se puede volver y corregir sin perder lo escrito.
      setPendingEmail(correo); // si cierra la app ahora, al reabrir vuelve a la confirmacion
      router.push({ pathname: '/verify-email', params: { correo } });
    } catch (e) {
      if (e instanceof AuthServiceError) {
        if (e.code === 'EMAIL_TAKEN') return setError('correo', { message: e.message });
        if (e.code === 'RFC_TAKEN') return setError('rfc', { message: e.message });
        return setFormError(e.message);
      }
      setFormError(AUTH_MESSAGES.UNKNOWN);
    }
  };

  return (
    <Screen>
      <AuthHeader titulo="Crear cuenta" subtitulo="Todos los campos son obligatorios, salvo los marcados como opcionales." />

      <Text style={styles.section}>Tu cuenta</Text>
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
        helper="Mínimo 8 caracteres."
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label="Confirmar contraseña"
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <Text style={styles.section}>Datos personales</Text>
      <FormTextField
        control={control}
        name="nombre"
        label="Nombre(s)"
        autoCapitalize="words"
        autoComplete="name-given"
        textContentType="givenName"
      />
      <FormTextField
        control={control}
        name="apellidoPaterno"
        label="Apellido paterno"
        autoCapitalize="words"
        autoComplete="name-family"
        textContentType="familyName"
      />
      <FormTextField
        control={control}
        name="apellidoMaterno"
        label="Apellido materno (opcional)"
        autoCapitalize="words"
      />
      <FormDateField control={control} name="nacimiento" label="Fecha de nacimiento" />
      <FormTextField
        control={control}
        name="rfc"
        label="RFC"
        helper="Persona física, 13 caracteres."
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={13}
      />

      <Text style={styles.section}>Domicilio</Text>
      <FormTextField control={control} name="calle" label="Calle" autoCapitalize="words" />
      <FormTextField control={control} name="numExt" label="Número exterior" autoCapitalize="characters" />
      <FormTextField
        control={control}
        name="numInt"
        label="Número interior (opcional)"
        autoCapitalize="characters"
      />
      <FormTextField control={control} name="colonia" label="Colonia" autoCapitalize="words" />
      <FormTextField
        control={control}
        name="cp"
        label="Código postal"
        keyboardType="number-pad"
        maxLength={5}
        autoComplete="postal-code"
        textContentType="postalCode"
      />
      <FormTextField control={control} name="municipio" label="Municipio" autoCapitalize="words" />
      <FormTextField control={control} name="estado" label="Estado" autoCapitalize="words" />

      {/* PROVISIONAL: reemplazar por enlace al aviso de privacidad cuando exista el texto. */}
      <FormCheckbox
        control={control}
        name="aceptoPrivacidad"
        label="Acepto el aviso de privacidad y los términos de uso."
      />

      <FormMessage message={formError} />

      <Button title="Crear cuenta" onPress={handleSubmit(onSubmit)} />
      <Button title="Ya tengo una cuenta" variant="text" onPress={() => router.dismissTo('/login')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...type.section, color: colors.ink, marginTop: spacing.sm },
});
