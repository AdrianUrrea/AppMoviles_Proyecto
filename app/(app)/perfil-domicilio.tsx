import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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
import { usePerfilCompleto } from '@/hooks/usePerfilCompleto';
import { useSession } from '@/providers/SessionProvider';
import { actualizacionDeDomicilio, domicilioDeFila, domicilioSinCambios } from '@/perfil/logica';
import { actualizarDomicilio, getPerfilErrorMessage } from '@/services/perfil';
import type { FilaPerfil } from '@/tramites/logica';
import { MSG } from '@/validation/mensajes';
import { domicilioSchema } from '@/validation/perfil';
import type { DomicilioData, DomicilioFormValues } from '@/validation/perfil';
import { colors, spacing } from '@/theme';

export default function PerfilDomicilioScreen() {
  const { perfil, loading, error, reintentar } = usePerfilCompleto();

  // El formulario se crea cuando ya hay perfil, para que arranque con los valores guardados.
  if (perfil) return <Formulario perfil={perfil} />;
  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? (
        <View style={styles.bloque}>
          <FormMessage message={error} />
          <Button title="Reintentar" variant="secondary" loading={loading} onPress={reintentar} />
        </View>
      ) : null}
    </Screen>
  );
}

function Formulario({ perfil }: { perfil: FilaPerfil }) {
  const router = useRouter();
  const { user } = useSession();
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<DomicilioFormValues, unknown, DomicilioData>({
    resolver: zodResolver(domicilioSchema),
    defaultValues: domicilioDeFila(perfil),
    mode: 'onBlur',
  });

  const volver = (guardado: boolean) =>
    router.dismissTo({ pathname: '/perfil', params: guardado ? { guardado: '1' } : {} });

  const guardar = async (datos: DomicilioData) => {
    setErrorGuardar(null);
    if (!user) return;
    if (domicilioSinCambios(perfil, datos)) return volver(false); // nada que enviar
    try {
      await actualizarDomicilio(user.id, actualizacionDeDomicilio(datos));
      volver(true);
    } catch (e) {
      setErrorGuardar(getPerfilErrorMessage(e)); // el formulario conserva lo escrito
    }
  };

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      <PageHeader titulo="Editar domicilio" descripcion="Es lo único que puedes cambiar de tu perfil." />
      <Note texto={MSG.perfil.domicilioAviso} />

      <Card>
        <FormTextField control={control} name="calle" label="Calle" autoCapitalize="words" />
        <FormTextField control={control} name="numExt" label="Número exterior" autoCapitalize="characters" />
        <FormTextField control={control} name="numInt" label="Número interior (opcional)" autoCapitalize="characters" />
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
      </Card>

      <View style={styles.bloque}>
        <FormMessage message={errorGuardar} />
        <Button title="Guardar cambios" loading={formState.isSubmitting} onPress={handleSubmit(guardar)} />
        <Button title="Cancelar" variant="text" onPress={() => volver(false)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ bloque: { gap: spacing.md } });
