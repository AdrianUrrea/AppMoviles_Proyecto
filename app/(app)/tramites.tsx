import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TramiteItem } from '@/components/TramiteItem';
import { Chip } from '@/components/ui/Chip';
import { ChipRow } from '@/components/ui/ChipRow';
import { GroupedList } from '@/components/ui/GroupedList';
import { Note } from '@/components/ui/Note';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { SectionCard } from '@/components/ui/SectionCard';
import { TextField } from '@/components/ui/TextField';
import { CATEGORIAS, TRAMITES, filtrarTramites } from '@/tramites/catalogo';
import type { CategoriaId } from '@/tramites/catalogo';
import { MSG } from '@/validation/mensajes';
import { colors, spacing, type } from '@/theme';

const VENTANA_TOQUE_MS = 700;

export default function TramitesScreen() {
  const router = useRouter();
  const ultimoToque = useRef(0);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaId | 'todas'>('todas');

  const resultados = useMemo(() => filtrarTramites(TRAMITES, texto, categoria), [texto, categoria]);
  // Sin busqueda ni filtro se muestran agrupados por categoria; con alguno de los dos, en una sola lista.
  const agrupar = categoria === 'todas' && texto.trim() === '';

  const sinRepetir = () => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < VENTANA_TOQUE_MS) return false; // doble toque
    ultimoToque.current = ahora;
    return true;
  };
  const abrir = (id: string) => {
    if (sinRepetir()) router.push({ pathname: '/tramite-detalle', params: { id } });
  };
  const abrirDinero = () => {
    if (sinRepetir()) router.push('/datos-dinero');
  };

  const opciones: { id: CategoriaId | 'todas'; titulo: string }[] = [{ id: 'todas', titulo: 'Todos' }, ...CATEGORIAS];

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      <Note texto={MSG.tramites.aviso} icono="lock-closed-outline" />

      <SectionCard
        titulo="Mis datos de dinero"
        descripcion="Captura ingresos, deducciones y tu cuenta para devolución, y cópialos al portal."
        icono="cash-outline"
        variante="fila"
        onPress={abrirDinero}
      />

      <View style={styles.busqueda}>
        <TextField
          label="Buscar trámite"
          value={texto}
          onChangeText={setTexto}
          placeholder="Ej. constancia, RFC, e.firma"
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
        <Text style={styles.vacio}>{MSG.tramites.sinResultados}</Text>
      ) : agrupar ? (
        CATEGORIAS.map((c) => {
          const delGrupo = resultados.filter((t) => t.categoria === c.id);
          if (delGrupo.length === 0) return null;
          return (
            <Section key={c.id} titulo={c.titulo}>
              <GroupedList>
                {delGrupo.map((t) => (
                  <TramiteItem key={t.id} tramite={t} onPress={() => abrir(t.id)} />
                ))}
              </GroupedList>
            </Section>
          );
        })
      ) : (
        <GroupedList>
          {resultados.map((t) => (
            <TramiteItem key={t.id} tramite={t} mostrarCategoria={categoria === 'todas'} onPress={() => abrir(t.id)} />
          ))}
        </GroupedList>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  busqueda: { gap: spacing.sm },
  vacio: { ...type.body, color: colors.muted },
});
