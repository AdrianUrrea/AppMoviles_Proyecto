import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FilaCopia } from '@/dinero/formularios';
import { copiarAlPortapapeles } from '@/lib/portapapeles';
import { AccionCopiar } from '@/components/ui/AccionCopiar';
import { Button } from '@/components/ui/Button';
import { GroupedList } from '@/components/ui/GroupedList';
import { Progreso } from '@/components/ui/Progreso';
import { cifras, colors, spacing, type } from '@/theme';

type Props = { filas: readonly FilaCopia[] };

/**
 * Lista ordenada como el formulario, una tarjeta por seccion. Cada dato se copia con un toque y queda marcado,
 * para llevar la cuenta de cuales ya pegaste en el portal. Si el valor cambia, la marca se quita.
 */
export function ListaParaCopiar({ filas }: Props) {
  const [copiados, setCopiados] = useState<ReadonlySet<string>>(new Set());
  const llave = (f: FilaCopia) => `${f.id}|${f.copiar}`;

  const copiar = async (f: FilaCopia) => {
    if (!(await copiarAlPortapapeles(f.copiar))) return;
    setCopiados((prev) => new Set(prev).add(llave(f)));
  };

  const hechos = filas.filter((f) => copiados.has(llave(f))).length;

  // Agrupa filas consecutivas de la misma seccion.
  const grupos: { seccion: string; filas: FilaCopia[] }[] = [];
  for (const f of filas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.seccion === f.seccion) ultimo.filas.push(f);
    else grupos.push({ seccion: f.seccion, filas: [f] });
  }

  return (
    <View style={styles.contenedor}>
      <Progreso hechos={hechos} total={filas.length} etiqueta="copiados" />

      {grupos.map((g) => (
        <View key={g.seccion} style={styles.grupo}>
          <Text style={styles.seccion}>{g.seccion}</Text>
          <GroupedList>
            {g.filas.map((f) => {
              const copiado = copiados.has(llave(f));
              return (
                <Pressable
                  key={f.id}
                  onPress={() => copiar(f)}
                  accessibilityRole="button"
                  accessibilityLabel={`Copiar ${f.etiqueta}${f.sensible ? '' : `: ${f.mostrar}`}${f.detalle ? `. ${f.detalle}` : ''}${f.aviso ? `. Aviso: ${f.aviso}` : ''}`}
                  accessibilityState={{ selected: copiado }}
                  style={({ pressed }) => [styles.fila, pressed && styles.presionada, copiado && styles.copiada]}
                >
                  <View style={styles.texto}>
                    <Text style={styles.etiqueta}>{f.etiqueta}</Text>
                    <Text style={styles.valor}>{f.mostrar}</Text>
                    {f.detalle ? (
                      <Text style={styles.detalle} numberOfLines={2}>
                        {f.detalle}
                      </Text>
                    ) : null}
                    {f.aviso ? (
                      <View style={styles.aviso}>
                        <Ionicons name="alert-circle-outline" size={15} color={colors.warning} style={styles.avisoIcono} />
                        <Text style={styles.avisoTexto}>{f.aviso}</Text>
                      </View>
                    ) : null}
                  </View>
                  <AccionCopiar copiado={copiado} />
                </Pressable>
              );
            })}
          </GroupedList>
        </View>
      ))}

      {hechos > 0 ? <Button title="Quitar marcas" variant="text" onPress={() => setCopiados(new Set())} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: spacing.lg },
  grupo: { gap: spacing.sm },
  seccion: { ...type.overline, color: colors.muted, paddingHorizontal: spacing.xs },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 64 },
  presionada: { backgroundColor: colors.tint },
  copiada: { backgroundColor: colors.successTint },
  texto: { flex: 1, gap: 2 },
  etiqueta: { ...type.caption, color: colors.muted },
  valor: { ...type.body, ...cifras, fontSize: 17, fontWeight: '700', color: colors.ink },
  detalle: { ...type.caption, fontSize: 12, color: colors.muted },
  aviso: { flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  avisoIcono: { marginTop: 2 },
  avisoTexto: { ...type.caption, fontSize: 12, color: colors.warning, flex: 1 },
});
