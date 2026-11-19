import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { copiarAlPortapapeles } from '@/lib/portapapeles';
import { colors, spacing, type } from '@/theme';

type Props = { etiqueta: string; valor: string };

/** Fila con un dato del usuario y un boton para copiarlo (para pegarlo en el formulario del SAT). Va dentro de GroupedList. */
export function DatoCopiable({ etiqueta, valor }: Props) {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  const copiar = async () => {
    if (!(await copiarAlPortapapeles(valor))) return;
    setCopiado(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopiado(false), 1500);
  };

  return (
    <Pressable
      onPress={copiar}
      accessibilityRole="button"
      accessibilityLabel={`Copiar ${etiqueta}: ${valor}`}
      style={({ pressed }) => [styles.fila, (pressed || copiado) && styles.activa]}
    >
      <View style={styles.texto}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        <Text style={styles.valor}>{valor}</Text>
      </View>
      <View style={styles.accion}>
        <Ionicons name={copiado ? 'checkmark-circle' : 'copy-outline'} size={22} color={colors.primary} />
        <Text style={styles.accionTexto}>{copiado ? 'Copiado' : 'Copiar'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 60 },
  activa: { backgroundColor: colors.tint },
  texto: { flex: 1, gap: 2 },
  etiqueta: { ...type.caption, color: colors.muted },
  valor: { ...type.body, fontWeight: '600', color: colors.ink },
  accion: { alignItems: 'center', minWidth: 58 },
  accionTexto: { ...type.caption, fontSize: 12, color: colors.primary },
});
