import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormMessage } from '@/components/ui/FormMessage';
import { Note } from '@/components/ui/Note';
import { aplicarSugeridos, ajustesDe, describirAjuste, listaDeMeses, valoresSugeridos } from '@/dinero/acumulado';
import { camposDe, valoresVacios } from '@/dinero/formularios';
import type { Valores } from '@/dinero/formularios';
import { formatearMonto } from '@/dinero/montos';
import { useAcumuladoEjercicio } from '@/hooks/useAcumuladoEjercicio';
import { confirmar } from '@/lib/confirmar';
import { MSG } from '@/validation/mensajes';
import { colors, spacing, type } from '@/theme';

type Props = {
  ejercicio: string;
  /** Lo que hay escrito ahora en el formulario anual (se actualiza al teclear). */
  actuales: Partial<Valores>;
  /** Escribe estos valores en el formulario anual (solo los campos indicados). */
  onAplicar: (valores: Valores) => void;
};

/**
 * Declaracion anual: lo que suman las declaraciones mensuales del ejercicio, y cuanto se ha ajustado a mano.
 *  - Si la anual esta totalmente vacia, se llena sola con la suma (una vez al abrir). Queda como borrador: se guarda
 *    con el boton Guardar, y lo que la persona cambie despues es un "ajuste" que se muestra aqui.
 *  - "Llenar los campos vacios" respeta lo ya escrito; "Volver a los totales" reemplaza (con confirmacion).
 *  - Sin declaraciones mensuales guardadas, solo explica como usar la funcion.
 */
export function ResumenDeMensuales({ ejercicio, actuales, onAplicar }: Props) {
  const { acumulado, cargando, sinConexion } = useAcumuladoEjercicio(ejercicio);
  const [llenados, setLlenados] = useState(0);
  const yaIntentado = useRef(false);

  const completos = useMemo<Valores>(() => ({ ...valoresVacios('anual'), ...(actuales as Valores) }), [actuales]);
  const sugeridos = useMemo(() => (acumulado ? valoresSugeridos(acumulado) : {}), [acumulado]);
  const ajustes = useMemo(() => (acumulado ? ajustesDe(acumulado, actuales) : []), [acumulado, actuales]);

  const aplicar = (modo: 'vacios' | 'todos') => {
    const { valores, cambiados } = aplicarSugeridos(completos, sugeridos, modo);
    if (cambiados.length === 0) return;
    onAplicar(Object.fromEntries(cambiados.map((id) => [id, valores[id]])));
    setLlenados(cambiados.length);
  };

  // Una sola vez al abrir: si la anual esta vacia por completo, ya viene con el total del año.
  useEffect(() => {
    if (!acumulado || yaIntentado.current) return;
    yaIntentado.current = true;
    const todoVacio = camposDe('anual').every((c) => (completos[c.id] ?? '').trim() === '');
    if (todoVacio) aplicar('vacios');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acumulado]);

  if (cargando || !acumulado) return null;
  if (acumulado.mesesCapturados.length === 0) return <Note texto={MSG.dinero.anualVacioMensuales} icono="bulb-outline" />;

  const n = acumulado.mesesCapturados.length;
  const hayVacios = ajustes.some((a) => a.escrito === null);
  const hayAjustes = ajustes.some((a) => a.ajuste !== null && a.ajuste !== 0);

  const volverATotales = async () => {
    const cuantos = ajustes.filter((a) => a.ajuste !== null && a.ajuste !== 0).length;
    const acepta = await confirmar(
      'Volver a los totales',
      `Se reemplazarán ${cuantos} ${cuantos === 1 ? 'monto' : 'montos'} por la suma de tus declaraciones mensuales. Perderás tus ajustes.`,
      'Reemplazar',
    );
    if (acepta) aplicar('todos');
  };

  return (
    <View style={styles.bloque}>
      <Card variante="tint">
        <View style={styles.contenido} accessibilityLiveRegion="polite">
          <Text style={styles.titulo}>De tus declaraciones mensuales de {ejercicio}</Text>
          <Text style={styles.nota}>
            {n} {n === 1 ? 'mes guardado' : 'meses guardados'}: {listaDeMeses(acumulado.mesesCapturados)}.
          </Text>
          {acumulado.mesesFaltantes.length > 0 ? (
            <Text style={styles.nota}>
              Faltan: {listaDeMeses(acumulado.mesesFaltantes)}. Captúralos en «Declaración mensual» para que la suma esté completa.
            </Text>
          ) : null}

          {ajustes.map((a) => (
            <View key={a.anual} style={styles.concepto}>
              <View style={styles.fila}>
                <Text style={styles.etiqueta}>{a.etiqueta}</Text>
                <Text style={styles.valor}>{formatearMonto(a.mensual)}</Text>
              </View>
              {a.escrito === null ? (
                <Text style={styles.nota}>Aún vacío en tu declaración anual.</Text>
              ) : a.ajuste === 0 ? (
                <Text style={styles.nota}>En tu declaración anual: igual a la suma.</Text>
              ) : (
                <Text style={styles.nota}>
                  En tu declaración anual: {formatearMonto(a.escrito)} (ajuste de {describirAjuste(a.ajuste ?? 0)}).
                </Text>
              )}
            </View>
          ))}
        </View>
      </Card>

      {llenados > 0 ? <FormMessage tone="info" message={MSG.dinero.anualLlenado} /> : null}
      {sinConexion ? <FormMessage tone="info" message={MSG.dinero.anualSinConexion} /> : null}

      {hayVacios ? <Button title="Llenar los campos vacíos con estos totales" variant="tonal" onPress={() => aplicar('vacios')} /> : null}
      {hayAjustes ? <Button title="Volver a los totales de mis mensuales" variant="text" onPress={() => void volverATotales()} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: spacing.md },
  contenido: { gap: spacing.sm },
  titulo: { ...type.label, fontSize: 16, color: colors.ink },
  concepto: { gap: 2 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  etiqueta: { ...type.body, color: colors.ink, flex: 1 },
  valor: { ...type.label, fontSize: 16, color: colors.ink },
  nota: { ...type.caption, color: colors.muted },
});
