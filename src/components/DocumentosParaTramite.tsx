import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ListaParaCopiar } from '@/components/ListaParaCopiar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormMessage } from '@/components/ui/FormMessage';
import { GroupedList } from '@/components/ui/GroupedList';
import { Note } from '@/components/ui/Note';
import { Section } from '@/components/ui/Section';
import { contarPorTipo, filasDeCantidades } from '@/documentos/cantidades';
import type { CantidadEncontrada } from '@/documentos/cantidades';
import { formatearFechaCorta } from '@/documentos/logica';
import type { Documento } from '@/documentos/logica';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useLecturaDeCantidades } from '@/hooks/useLecturaDeCantidades';
import { urlsFirmadas } from '@/services/documentos';
import { borrarTemporal } from '@/services/imagen';
import { lecturaDisponible } from '@/services/ocr';
import { MSG } from '@/validation/mensajes';
import { colors, radius, spacing, type } from '@/theme';

/**
 * "Tus documentos" dentro de un tramite: cada documento guardado con su nombre y su fecha de creacion. Al elegir uno se
 * lee en el telefono y se muestran sus montos para copiarlos al portal (las fechas, con un toque mas). Elegir el
 * documento ES la peticion de leerlo; lo ya leido se recuerda mientras la pantalla siga abierta.
 */
export function DocumentosParaTramite() {
  const router = useRouter();
  const { documentos, urls, loading, error, recargar } = useDocumentos();
  const [abierto, setAbierto] = useState<string | null>(null);
  const lecturas = useRef<Record<string, CantidadEncontrada[]>>({});
  const disponible = useMemo(() => lecturaDisponible(), []);

  return (
    <Section titulo={MSG.documentosDelTramite.titulo} ayuda={MSG.documentosDelTramite.ayuda}>
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
            <Text style={styles.vacioTexto}>{MSG.documentosDelTramite.vacio}</Text>
            <Button title={MSG.documentosDelTramite.agregar} variant="secondary" onPress={() => router.push('/documentos')} />
          </View>
        </Card>
      ) : null}

      {documentos.map((d) => {
        const seleccionado = abierto === d.id;
        return (
          <View key={d.id} style={styles.bloque}>
            <GroupedList>
              <FilaDocumento
                documento={d}
                miniaturaUrl={urls[d.ruta]}
                seleccionado={seleccionado}
                onPress={() => setAbierto(seleccionado ? null : d.id)}
              />
            </GroupedList>
            {seleccionado ? (
              disponible ? (
                <MontosDelDocumento
                  documento={d}
                  inicial={lecturas.current[d.id] ?? null}
                  alLeer={(c) => {
                    lecturas.current[d.id] = c;
                  }}
                  verDocumento={() => router.push({ pathname: '/documento-detalle', params: { id: d.id } })}
                />
              ) : (
                <Note
                  texto={`${MSG.documento.lectura.noDisponible}${__DEV__ ? ' (Desarrollo: requiere una development build; no funciona en Expo Go.)' : ''}`}
                />
              )
            ) : null}
          </View>
        );
      })}
    </Section>
  );
}

type FilaProps = { documento: Documento; miniaturaUrl?: string; seleccionado: boolean; onPress: () => void };

/** Fila de un documento: miniatura, nombre y fecha de creacion. Al tocarla se abre o se cierra su lectura. */
function FilaDocumento({ documento, miniaturaUrl, seleccionado, onPress }: FilaProps) {
  const fecha = formatearFechaCorta(documento.creadoEn);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${documento.nombre}, creado el ${fecha}`}
      accessibilityHint={seleccionado ? 'Oculta los montos del documento' : 'Muestra los montos del documento'}
      accessibilityState={{ expanded: seleccionado }}
      style={({ pressed }) => [styles.fila, (pressed || seleccionado) && styles.filaActiva]}
    >
      {miniaturaUrl ? (
        <Image source={{ uri: miniaturaUrl }} style={styles.miniatura} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.miniatura, styles.sinMiniatura]}>
          <Ionicons name="document-text-outline" size={26} color={colors.primary} />
        </View>
      )}
      <View style={styles.texto}>
        <Text style={styles.nombre} numberOfLines={2}>
          {documento.nombre}
        </Text>
        <Text style={styles.meta}>Creado el {fecha}</Text>
      </View>
      <Ionicons name={seleccionado ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
    </Pressable>
  );
}

type MontosProps = {
  documento: Documento;
  inicial: CantidadEncontrada[] | null;
  alLeer: (cantidades: CantidadEncontrada[]) => void;
  verDocumento: () => void;
};

/** Lee el documento elegido (si aun no se habia leido) y muestra sus montos; las fechas, a peticion. */
function MontosDelDocumento({ documento, inicial, alLeer, verDocumento }: MontosProps) {
  const [verFechas, setVerFechas] = useState(false);

  // La imagen vive en la nube y los enlaces caducan: se pide uno nuevo, se baja a la cache solo para leerla y se borra.
  const obtenerImagen = async () => {
    const enlaces = await urlsFirmadas([documento.ruta]);
    const url = enlaces[documento.ruta];
    if (!url) throw new Error('Sin enlace de imagen');
    const archivo = await File.downloadFileAsync(url, new File(Paths.cache, `lectura-${documento.id}.jpg`), { idempotent: true });
    return { uri: archivo.uri, limpiar: () => borrarTemporal(archivo.uri) };
  };

  const { cantidades, leyendo, error, lecturas, leer } = useLecturaDeCantidades(obtenerImagen, { inicial, alLeer });

  useEffect(() => {
    if (!inicial) void leer();
    // Solo al abrir el documento: la lectura nunca se repite sola.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { montos, fechas } = cantidades ? contarPorTipo(cantidades) : { montos: 0, fechas: 0 };
  const filas = cantidades ? filasDeCantidades(cantidades, false, verFechas) : [];

  return (
    <View style={styles.panel}>
      {leyendo ? (
        <View style={styles.leyendo}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.nota}>{MSG.documentosDelTramite.leyendo}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.bloque}>
          <FormMessage message={error} />
          <Button title="Reintentar" variant="secondary" loading={leyendo} onPress={() => void leer()} />
        </View>
      ) : null}

      {cantidades && !leyendo ? (
        <>
          {montos === 0 ? <Text style={styles.nota}>{MSG.documento.lectura.sinMontos}</Text> : null}
          {filas.length > 0 ? <ListaParaCopiar key={`${lecturas}-${verFechas ? 'f' : 'm'}`} filas={filas} /> : null}
          <Text style={styles.nota}>{MSG.documento.lectura.aviso}</Text>
          {fechas > 0 ? (
            <Button
              title={verFechas ? 'Ocultar fechas' : `Mostrar fechas (${fechas})`}
              variant="text"
              onPress={() => setVerFechas((v) => !v)}
            />
          ) : null}
          <Button title="Leer de nuevo" variant="text" loading={leyendo} onPress={() => void leer()} />
          <Button title={MSG.documentosDelTramite.verDocumento} variant="text" onPress={verDocumento} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: spacing.md },
  vacio: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  vacioTexto: { ...type.body, color: colors.muted, textAlign: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  filaActiva: { backgroundColor: colors.tint },
  miniatura: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.tint },
  sinMiniatura: { alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1, gap: 2 },
  nombre: { ...type.label, fontSize: 16, lineHeight: 21, color: colors.ink },
  meta: { ...type.caption, color: colors.muted },
  panel: { gap: spacing.md },
  leyendo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nota: { ...type.caption, color: colors.muted },
});
