import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { LecturaDeCantidades } from '@/components/LecturaDeCantidades';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { formatearFechaCorta, formatearTamano } from '@/documentos/logica';
import { useDocumento } from '@/hooks/useDocumentos';
import { confirmar } from '@/lib/confirmar';
import { eliminarDocumento, getDocumentoErrorMessage } from '@/services/documentos';
import { borrarTemporal } from '@/services/imagen';
import { colors, radius, spacing, type } from '@/theme';

export default function DocumentoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!id) return <Redirect href="/documentos" />;
  return <Contenido id={id} />;
}

function Contenido({ id }: { id: string }) {
  const router = useRouter();
  const { documento, url, loading, error, recargar } = useDocumento(id);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [imagenFallo, setImagenFallo] = useState(false);

  const eliminar = async () => {
    if (!documento) return;
    setErrorAccion(null);
    if (!(await confirmar('Eliminar documento', `¿Eliminar "${documento.nombre}"? Esta acción no se puede deshacer.`))) return;
    try {
      await eliminarDocumento(documento);
      router.dismissTo('/documentos');
    } catch (e) {
      setErrorAccion(getDocumentoErrorMessage(e)); // el documento sigue visible; se puede reintentar
    }
  };

  // La imagen vive en la nube: se baja a la cache solo para leerla y se borra al terminar.
  const imagenParaLeer = async () => {
    if (!url) throw new Error('Sin enlace de imagen');
    const archivo = await File.downloadFileAsync(url, new File(Paths.cache, `lectura-${id}.jpg`), { idempotent: true });
    return { uri: archivo.uri, limpiar: () => borrarTemporal(archivo.uri) };
  };

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      {loading && !documento ? <ActivityIndicator color={colors.primary} /> : null}

      {error ? (
        <View style={styles.bloque}>
          <FormMessage message={error} />
          <Button title="Reintentar" variant="secondary" loading={loading} onPress={recargar} />
          <Button title="Volver a Documentos" variant="text" onPress={() => router.dismissTo('/documentos')} />
        </View>
      ) : null}

      {documento ? (
        <>
          <View style={styles.vista}>
            {url && !imagenFallo ? (
              <Image
                source={{ uri: url }}
                style={styles.imagen}
                resizeMode="contain"
                accessibilityLabel={`Imagen del documento ${documento.nombre}`}
                onError={() => setImagenFallo(true)}
              />
            ) : (
              <View style={[styles.imagen, styles.sinImagen]}>
                <Text style={styles.meta}>No se pudo cargar la imagen.</Text>
                <Button title="Reintentar" variant="text" onPress={() => { setImagenFallo(false); recargar(); }} />
              </View>
            )}
          </View>

          <View style={styles.datos}>
            <Text style={styles.nombre}>{documento.nombre}</Text>
            <Text style={styles.meta}>
              {formatearFechaCorta(documento.creadoEn)} · {formatearTamano(documento.tamano)}
            </Text>
          </View>

          {url && !imagenFallo ? <LecturaDeCantidades obtenerImagen={imagenParaLeer} nombreDocumento={documento.nombre} /> : null}

          <FormMessage message={errorAccion} />
          <Button title="Eliminar documento" variant="secondary" onPress={eliminar} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: spacing.md },
  vista: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.tint, borderWidth: 1, borderColor: colors.line },
  imagen: { width: '100%', height: 420 },
  sinImagen: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  datos: { gap: spacing.xs },
  nombre: { ...type.heading, color: colors.ink },
  meta: { ...type.body, color: colors.muted },
});
