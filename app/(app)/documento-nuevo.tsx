import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '@/components/form';
import { LecturaDeCantidades } from '@/components/LecturaDeCantidades';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { documentoNuevoSchema } from '@/documentos/esquema';
import type { DocumentoNuevoData, DocumentoNuevoFormValues } from '@/documentos/esquema';
import { TAMANO_MAXIMO_BYTES, nombreSugerido, normalizarUriLocal } from '@/documentos/logica';
import { logDev } from '@/lib/log';
import { useSession } from '@/providers/SessionProvider';
import { DocumentoError, getDocumentoErrorMessage, subirDocumento } from '@/services/documentos';
import { borrarTemporal, prepararImagen } from '@/services/imagen';
import { colors, radius, spacing, type } from '@/theme';

export default function DocumentoNuevoScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  if (!uri) return <Redirect href="/documentos" />;
  return <Contenido uri={uri} />;
}

function Contenido({ uri: uriRecibida }: { uri: string }) {
  // Los parametros de ruta pueden deshacer el escape; se vuelve a aplicar (es idempotente).
  const uri = normalizarUriLocal(uriRecibida);
  const router = useRouter();
  const { user } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [sinVistaPrevia, setSinVistaPrevia] = useState(false);

  const { control, handleSubmit } = useForm<DocumentoNuevoFormValues, unknown, DocumentoNuevoData>({
    resolver: zodResolver(documentoNuevoSchema),
    defaultValues: { nombre: nombreSugerido(new Date()) },
    mode: 'onBlur',
  });

  const guardar = async ({ nombre }: DocumentoNuevoData) => {
    setError(null);
    if (!user) {
      setError(getDocumentoErrorMessage(null));
      return;
    }
    try {
      const imagen = await prepararImagen(uri);
      try {
        if (imagen.tamano > TAMANO_MAXIMO_BYTES) throw new DocumentoError('TOO_LARGE');
        await subirDocumento({ userId: user.id, nombre, bytes: imagen.bytes, tamano: imagen.tamano });
      } finally {
        borrarTemporal(imagen.uri);
      }
      router.dismissTo('/documentos');
    } catch (e) {
      // La foto y el nombre se conservan para reintentar sin volver a tomarla.
      if (!(e instanceof DocumentoError)) logDev('documento-nuevo', e); // errores de preparar la imagen
      setError(getDocumentoErrorMessage(e));
    }
  };

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      <View style={styles.vista}>
        <Image
          source={{ uri }}
          style={styles.imagen}
          resizeMode="contain"
          accessibilityLabel="Vista previa del documento"
          onError={(ev) => {
            setSinVistaPrevia(true);
            logDev('documento-nuevo.vista-previa', new Error(`${String(ev.nativeEvent?.error)} | uri=${uri}`));
          }}
        />
      </View>
      {sinVistaPrevia ? (
        <Text style={styles.aviso}>No se pudo mostrar la vista previa de la foto. Puedes intentar guardarla, o descartar y tomarla de nuevo.</Text>
      ) : null}

      <LecturaDeCantidades obtenerImagen={async () => ({ uri })} />

      <FormTextField control={control} name="nombre" label="Nombre del documento" maxLength={80} autoCapitalize="sentences" />

      <FormMessage message={error} />

      <Button title="Guardar documento" onPress={handleSubmit(guardar)} />
      <Button title="Descartar" variant="text" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  vista: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.tint, borderWidth: 1, borderColor: colors.line },
  imagen: { width: '100%', height: 340 },
  aviso: { ...type.caption, color: colors.danger },
});
