import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Chip } from '@/components/ui/Chip';
import { ChipRow } from '@/components/ui/ChipRow';
import { GroupedList } from '@/components/ui/GroupedList';
import { ListRow } from '@/components/ui/ListRow';
import { Note } from '@/components/ui/Note';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { TextField } from '@/components/ui/TextField';
import { CATEGORIAS_GUIA, GUIAS, filtrarGuias } from '@/guias/catalogo';
import type { CategoriaGuiaId } from '@/guias/catalogo';
import { MSG } from '@/validation/mensajes';
import { colors, spacing, type } from '@/theme';

const VENTANA_TOQUE_MS = 700;

export default function GuiasScreen() {
  const router = useRouter();
  const ultimoToque = useRef(0);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGuiaId | 'todas'>('todas');

  const resultados = useMemo(() => filtrarGuias(GUIAS, texto, categoria), [texto, categoria]);
  // Sin busqueda ni filtro se muestran agrupadas por categoria; con alguno de los dos, en una sola lista.
  const agrupar = categoria === 'todas' && texto.trim() === '';

  const abrir = (id: string) => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < VENTANA_TOQUE_MS) return; // doble toque
    ultimoToque.current = ahora;
    router.push({ pathname: '/guia-detalle', params: { id } });
  };

  const opciones: { id: CategoriaGuiaId | 'todas'; titulo: string }[] = [
    { id: 'todas', titulo: 'Todas' },
    ...CATEGORIAS_GUIA.map((c) => ({ id: c.id, titulo: c.titulo })),
  ];

  const fila = (g: (typeof GUIAS)[number], mostrarCategoria: boolean) => (
    <ListRow
      key={g.id}
      icono="book-outline"
      titulo={g.titulo}
      descripcion={g.resumen}
      etiqueta={mostrarCategoria ? CATEGORIAS_GUIA.find((c) => c.id === g.categoria)?.titulo : undefined}
      onPress={() => abrir(g.id)}
      accessibilityHint="Abre la explicación"
    />
  );

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      <Note texto={MSG.guias.intro} icono="bulb-outline" />

      <View style={styles.busqueda}>
        <TextField
          label="Buscar un término"
          value={texto}
          onChangeText={setTexto}
          placeholder="Ej. RFC, factura, e.firma"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <ChipRow>
          {opciones.map((o) => (
            <Chip key={o.id} titulo={o.titulo} seleccionado={categoria === o.id} onPress={() => setCategoria(o.id)} />
          ))}
        </ChipRow>
      </View>

      {resultados.length === 0 ? (
        <Text style={styles.vacio}>{MSG.guias.sinResultados}</Text>
      ) : agrupar ? (
        CATEGORIAS_GUIA.map((c) => {
          const delGrupo = resultados.filter((g) => g.categoria === c.id);
          if (delGrupo.length === 0) return null;
          return (
            <Section key={c.id} titulo={c.titulo} ayuda={c.descripcion}>
              <GroupedList>{delGrupo.map((g) => fila(g, false))}</GroupedList>
            </Section>
          );
        })
      ) : (
        <GroupedList>{resultados.map((g) => fila(g, categoria === 'todas'))}</GroupedList>
      )}

      <Text style={styles.nota}>{MSG.guias.aviso}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  busqueda: { gap: spacing.sm },
  vacio: { ...type.body, color: colors.muted },
  nota: { ...type.caption, color: colors.muted },
});
