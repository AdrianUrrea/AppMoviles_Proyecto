import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { DatoCopiable } from '@/components/DatoCopiable';
import { DocumentosParaTramite } from '@/components/DocumentosParaTramite';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormMessage } from '@/components/ui/FormMessage';
import { GroupedList } from '@/components/ui/GroupedList';
import { ListRow } from '@/components/ui/ListRow';
import { Note } from '@/components/ui/Note';
import { PageHeader } from '@/components/ui/PageHeader';
import { Progreso } from '@/components/ui/Progreso';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { ICONO_DINERO } from '@/config/iconosDinero';
import { usePerfilCompleto } from '@/hooks/usePerfilCompleto';
import { abrirEnlaceSat } from '@/lib/enlaces';
import { guiasDeTramite } from '@/guias/catalogo';
import { ACCESOS, CATEGORIAS, VERIFICADO_EN, buscarTramite } from '@/tramites/catalogo';
import type { Tramite } from '@/tramites/catalogo';
import { FORMULARIOS } from '@/dinero/formularios';
import { filasDeDatos } from '@/tramites/logica';
import { MSG } from '@/validation/mensajes';
import { colors, radius, spacing, type } from '@/theme';

export default function TramiteDetalleScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const tramite = id ? buscarTramite(id) : undefined;
  if (!tramite) return <Redirect href="/tramites" />;
  return <Contenido tramite={tramite} />;
}

function Contenido({ tramite }: { tramite: Tramite }) {
  const router = useRouter();
  const { perfil, loading, error, reintentar } = usePerfilCompleto();
  const [hechos, setHechos] = useState<Record<number, boolean>>({});
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);

  const filas = perfil ? filasDeDatos(perfil, tramite.datos) : [];
  const identidad = filas.filter((f) => f.grupo === 'identidad');
  const domicilio = filas.filter((f) => f.grupo === 'domicilio');
  const categoria = CATEGORIAS.find((c) => c.id === tramite.categoria)?.titulo;
  const requisitosHechos = tramite.requisitos.filter((_, i) => hechos[i]).length;
  const [principal, ...otrosEnlaces] = tramite.enlaces;
  const guias = guiasDeTramite(tramite.id);

  const abrir = async (url: string) => {
    setErrorEnlace(null);
    const resultado = await abrirEnlaceSat(url);
    if (resultado === 'no_seguro') setErrorEnlace(MSG.tramites.enlaceNoSeguro);
    else if (resultado === 'error') setErrorEnlace(MSG.tramites.noSeAbrio);
  };

  // La accion principal queda fija abajo: se puede abrir el portal sin recorrer toda la pantalla.
  const pie = principal ? (
    <>
      <FormMessage message={errorEnlace} />
      <Button title={`Abrir: ${principal.titulo}`} onPress={() => abrir(principal.url)} />
    </>
  ) : undefined;

  return (
    <Screen conEncabezado espaciado={spacing.xl} pie={pie}>
      <PageHeader titulo={tramite.titulo} descripcion={tramite.descripcion} etiqueta={categoria}>
        <View style={styles.accesos}>
          <Text style={styles.accesosTitulo}>Ingresas con</Text>
          {tramite.acceso.map((a) => (
            <View key={a} style={styles.acceso}>
              <Text style={styles.accesoTexto}>{ACCESOS[a]}</Text>
            </View>
          ))}
        </View>
      </PageHeader>

      {tramite.notas ? <Note texto={tramite.notas} icono="bulb-outline" /> : null}

      <Section
        titulo="Qué necesitas"
        derecha={
          <View style={styles.progresoCorto}>
            <Progreso hechos={requisitosHechos} total={tramite.requisitos.length} etiqueta="listos" />
          </View>
        }
      >
        <Card>
          {tramite.requisitos.map((r, i) => (
            <Checkbox key={r} label={r} checked={!!hechos[i]} onChange={(v) => setHechos((h) => ({ ...h, [i]: v }))} />
          ))}
        </Card>
      </Section>

      <Section titulo="Pasos en el portal">
        <Card>
          {tramite.ruta.map((paso, i) => {
            const ultimo = i === tramite.ruta.length - 1;
            return (
              <View key={paso} style={styles.paso}>
                <View style={styles.pasoGuia}>
                  <Text style={styles.pasoNumero}>{i + 1}</Text>
                  {!ultimo ? <View style={styles.pasoLinea} /> : null}
                </View>
                <Text style={[styles.pasoTexto, !ultimo && styles.pasoConSiguiente]}>{paso}</Text>
              </View>
            );
          })}
        </Card>
      </Section>

      {guias.length > 0 ? (
        <Section titulo="Palabras que te ayudan" ayuda="¿Algo no te suena? Toca para ver la explicación.">
          <GroupedList>
            {guias.map((g) => (
              <ListRow
                key={g.id}
                icono="book-outline"
                titulo={g.titulo}
                descripcion={g.resumen}
                onPress={() => router.push({ pathname: '/guia-detalle', params: { id: g.id } })}
              />
            ))}
          </GroupedList>
        </Section>
      ) : null}

      <Section titulo="Tus datos" ayuda="Toca un dato para copiarlo y pegarlo en el portal.">
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? (
          <View style={styles.bloque}>
            <FormMessage message={error} />
            <Button title="Reintentar" variant="secondary" loading={loading} onPress={reintentar} />
          </View>
        ) : null}
        {!loading && !error && !perfil ? <Text style={styles.texto}>{MSG.tramites.sinPerfil}</Text> : null}
        {identidad.length > 0 ? (
          <GroupedList>
            {identidad.map((f) => (
              <DatoCopiable key={f.campo} etiqueta={f.etiqueta} valor={f.valor} />
            ))}
          </GroupedList>
        ) : null}
        {domicilio.length > 0 ? (
          <View style={styles.subgrupo}>
            <Text style={styles.subtitulo}>Domicilio</Text>
            <GroupedList>
              {domicilio.map((f) => (
                <DatoCopiable key={f.campo} etiqueta={f.etiqueta} valor={f.valor} />
              ))}
            </GroupedList>
          </View>
        ) : null}
        <Text style={styles.nota}>Tu CURP no se guarda en esta app: ten a la mano la tuya si el trámite la pide.</Text>
      </Section>

      <DocumentosParaTramite />

      {tramite.datosDinero && tramite.datosDinero.length > 0 ? (
        <Section titulo="Tus datos de dinero" ayuda="Captura tus cifras una vez y cópialas en orden cuando estés en el portal.">
          <GroupedList>
            {tramite.datosDinero.map((d) => (
              <ListRow
                key={d}
                icono={ICONO_DINERO[d]}
                titulo={FORMULARIOS[d].titulo}
                descripcion="Capturar y copiar"
                onPress={() => router.push({ pathname: '/datos-dinero-editor', params: { tipo: d } })}
              />
            ))}
          </GroupedList>
        </Section>
      ) : null}

      {otrosEnlaces.length > 0 ? (
        <Section titulo="Más enlaces">
          <GroupedList>
            {otrosEnlaces.map((e) => (
              <ListRow key={e.url} icono="open-outline" derecha={null} titulo={e.titulo} onPress={() => abrir(e.url)} />
            ))}
          </GroupedList>
        </Section>
      ) : null}

      <Text style={styles.nota}>
        {MSG.tramites.aviso} {MSG.tramites.confirmar} Revisado en {VERIFICADO_EN}.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: spacing.md },
  progresoCorto: { width: 112 },
  texto: { ...type.body, color: colors.muted },
  accesos: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  accesosTitulo: { ...type.caption, color: colors.muted },
  acceso: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  accesoTexto: { ...type.caption, fontWeight: '600', color: colors.ink },
  paso: { flexDirection: 'row', gap: spacing.md },
  pasoGuia: { alignItems: 'center', width: 26 },
  pasoNumero: { ...type.label, color: colors.onPrimary, backgroundColor: colors.primary, width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, overflow: 'hidden' },
  pasoLinea: { flex: 1, width: 2, marginTop: 4, backgroundColor: colors.tintStrong },
  pasoTexto: { ...type.body, color: colors.ink, flex: 1, paddingTop: 2 },
  pasoConSiguiente: { paddingBottom: spacing.lg },
  subgrupo: { gap: spacing.sm },
  subtitulo: { ...type.label, color: colors.muted },
  nota: { ...type.caption, color: colors.muted },
});
