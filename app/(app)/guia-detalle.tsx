import { StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { GroupedList } from '@/components/ui/GroupedList';
import { ListRow } from '@/components/ui/ListRow';
import { Note } from '@/components/ui/Note';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { CATEGORIAS_GUIA, buscarGuia, guiasRelacionadas } from '@/guias/catalogo';
import type { Guia } from '@/guias/catalogo';
import { buscarTramite } from '@/tramites/catalogo';
import type { Tramite } from '@/tramites/catalogo';
import { MSG } from '@/validation/mensajes';
import { colors, spacing, type } from '@/theme';

export default function GuiaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const guia = id ? buscarGuia(id) : undefined;
  if (!guia) return <Redirect href="/guias" />;
  return <Contenido guia={guia} />;
}

function Contenido({ guia }: { guia: Guia }) {
  const router = useRouter();
  const categoria = CATEGORIAS_GUIA.find((c) => c.id === guia.categoria)?.titulo;
  const relacionadas = guiasRelacionadas(guia);
  const tramites = guia.tramites.map(buscarTramite).filter((t): t is Tramite => t !== undefined);

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      <PageHeader titulo={guia.titulo} descripcion={guia.resumen} etiqueta={categoria} />

      <Section titulo="Qué es">
        <Card>
          {guia.queEs.map((parrafo) => (
            <Text key={parrafo} style={styles.texto}>
              {parrafo}
            </Text>
          ))}
        </Card>
      </Section>

      {guia.ejemplo ? (
        <Section titulo="Un ejemplo">
          <Card variante="tint">
            <Text style={styles.texto}>{guia.ejemplo}</Text>
          </Card>
        </Section>
      ) : null}

      <Section titulo="Para qué te sirve">
        <Card>
          <Vinetas items={guia.paraQue} />
        </Card>
      </Section>

      {guia.dondeLoEncuentras && guia.dondeLoEncuentras.length > 0 ? (
        <Section titulo="Dónde lo consigues o lo ves">
          <Card>
            <Vinetas items={guia.dondeLoEncuentras} />
          </Card>
        </Section>
      ) : null}

      {guia.ojo ? <Note texto={guia.ojo} icono="bulb-outline" /> : null}

      {tramites.length > 0 ? (
        <Section titulo="Trámites donde lo vas a usar" ayuda="Toca uno para ver qué necesitas y los pasos.">
          <GroupedList>
            {tramites.map((t) => (
              <ListRow
                key={t.id}
                icono="receipt-outline"
                titulo={t.titulo}
                onPress={() => router.push({ pathname: '/tramite-detalle', params: { id: t.id } })}
              />
            ))}
          </GroupedList>
        </Section>
      ) : null}

      {relacionadas.length > 0 ? (
        <Section titulo="Para entenderlo mejor" ayuda="Otros términos que se mencionan junto con este.">
          <GroupedList>
            {relacionadas.map((g) => (
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

      <Text style={styles.nota}>{MSG.guias.aviso}</Text>
    </Screen>
  );
}

function Vinetas({ items }: { items: readonly string[] }) {
  return (
    <View style={styles.vinetas}>
      {items.map((item) => (
        <View key={item} style={styles.vineta}>
          <Text style={styles.punto} accessibilityElementsHidden importantForAccessibility="no">
            •
          </Text>
          <Text style={styles.vinetaTexto}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  texto: { ...type.body, color: colors.ink },
  vinetas: { gap: spacing.sm },
  vineta: { flexDirection: 'row', gap: spacing.sm },
  punto: { ...type.body, color: colors.primary, fontWeight: '700' },
  vinetaTexto: { ...type.body, color: colors.ink, flex: 1 },
  nota: { ...type.caption, color: colors.muted },
});
