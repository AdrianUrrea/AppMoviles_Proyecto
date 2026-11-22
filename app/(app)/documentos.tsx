import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Linking, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DocumentoItem } from '@/components/DocumentoItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormMessage } from '@/components/ui/FormMessage';
import { GroupedList } from '@/components/ui/GroupedList';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { useDocumentos } from '@/hooks/useDocumentos';
import { elegirDeGaleria, recuperarCapturaPendiente, tomarFoto } from '@/services/camara';
import type { Captura } from '@/services/camara';
import { MSG } from '@/validation/mensajes';
import { colors, spacing, type } from '@/theme';

export default function DocumentosScreen() {
  const router = useRouter();
  const { documentos, urls, loading, error, recargar } = useDocumentos();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [permisoDenegado, setPermisoDenegado] = useState<{ puedePreguntar: boolean } | null>(null);

  // Al volver de Ajustes se quita el aviso viejo: la persona pudo activar el permiso (o "Preguntar siempre") y al
  // tocar "Tomar foto" otra vez se vuelve a pedir. Sin esto el mensaje se quedaba aunque ya estuviera activado.
  const irAAjustes = permisoDenegado !== null && !permisoDenegado.puedePreguntar;
  useEffect(() => {
    if (!irAAjustes) return;
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setPermisoDenegado(null);
    });
    return () => suscripcion.remove();
  }, [irAAjustes]);

  const irANuevo = (uri: string) => router.push({ pathname: '/documento-nuevo', params: { uri } });

  // Android puede cerrar la app mientras la camara esta abierta: recuperar la foto al volver.
  useEffect(() => {
    let activo = true;
    recuperarCapturaPendiente().then((c) => {
      if (activo && c?.estado === 'ok') irANuevo(c.uri);
    });
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const manejar = async (obtener: () => Promise<Captura>) => {
    setMensaje(null);
    setPermisoDenegado(null);
    try {
      const captura = await obtener();
      if (captura.estado === 'ok') irANuevo(captura.uri);
      else if (captura.estado === 'sin_permiso') setPermisoDenegado({ puedePreguntar: captura.puedePreguntar });
    } catch {
      setMensaje(MSG.camara.noSeAbrio);
    }
  };

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      <View style={styles.acciones}>
        <View style={styles.accion}>
          <Button title="Tomar foto" onPress={() => manejar(tomarFoto)} />
        </View>
        <View style={styles.accion}>
          <Button title="De la galería" variant="tonal" onPress={() => manejar(elegirDeGaleria)} />
        </View>
      </View>

      <FormMessage message={mensaje} />
      {permisoDenegado ? (
        <View style={styles.bloque}>
          <FormMessage message={permisoDenegado.puedePreguntar ? MSG.camara.sinPermisoReintentar : MSG.camara.sinPermiso} />
          {!permisoDenegado.puedePreguntar ? (
            <Button title="Abrir ajustes del teléfono" variant="secondary" onPress={() => Linking.openSettings()} />
          ) : null}
        </View>
      ) : null}

      <Section
        titulo="Mis documentos"
        derecha={documentos.length > 0 ? <Text style={styles.contador}>{documentos.length}</Text> : undefined}
      >
        {loading && documentos.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? (
          <View style={styles.bloque}>
            <FormMessage message={error} />
            <Button title="Reintentar" variant="secondary" loading={loading} onPress={recargar} />
          </View>
        ) : null}
        {!loading && !error && documentos.length === 0 ? (
          <Card>
            <View style={styles.vacio}>
              <Ionicons name="document-text-outline" size={32} color={colors.primary} />
              <Text style={styles.vacioTexto}>Aún no tienes documentos. Toma una foto para agregar el primero.</Text>
            </View>
          </Card>
        ) : null}
        {documentos.length > 0 ? (
          <GroupedList>
            {documentos.map((d) => (
              <DocumentoItem
                key={d.id}
                documento={d}
                miniaturaUrl={urls[d.ruta]}
                onPress={() => router.push({ pathname: '/documento-detalle', params: { id: d.id } })}
              />
            ))}
          </GroupedList>
        ) : null}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  acciones: { flexDirection: 'row', gap: spacing.md },
  accion: { flex: 1 },
  bloque: { gap: spacing.md },
  contador: { ...type.label, color: colors.muted },
  vacio: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  vacioTexto: { ...type.body, color: colors.muted, textAlign: 'center' },
});
