import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AcumuladoDelAnio } from '@/components/AcumuladoDelAnio';
import { FormTextField } from '@/components/form';
import { ListaParaCopiar } from '@/components/ListaParaCopiar';
import { ResumenDeMensuales } from '@/components/ResumenDeMensuales';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ChipRow } from '@/components/ui/ChipRow';
import { FormMessage } from '@/components/ui/FormMessage';
import { Note } from '@/components/ui/Note';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { crearEsquemaDinero } from '@/dinero/esquema';
import {
  FORMULARIOS,
  esTipoDato,
  etiquetaPeriodo,
  filasParaCopiar,
  periodosDisponibles,
  totales,
  valoresVacios,
} from '@/dinero/formularios';
import type { TipoDato, Valores } from '@/dinero/formularios';
import { formatearMonto } from '@/dinero/montos';
import { periodoMasReciente } from '@/dinero/local';
import { useCambiosLocalesDinero } from '@/hooks/useCambiosLocalesDinero';
import { useDatosDinero } from '@/hooks/useDatosDinero';
import type { ResultadoGuardado } from '@/hooks/useDatosDinero';
import { getDineroErrorMessage } from '@/services/datosDinero';
import { MSG } from '@/validation/mensajes';
import { colors, spacing, type } from '@/theme';

type Vista = 'capturar' | 'copiar';

export default function DatosDineroEditorScreen() {
  const { tipo, periodo } = useLocalSearchParams<{ tipo?: string; periodo?: string }>();
  if (!esTipoDato(tipo)) return <Redirect href="/datos-dinero" />;
  return <Contenido tipo={tipo} periodoInicial={periodo} />;
}

function Contenido({ tipo, periodoInicial }: { tipo: TipoDato; periodoInicial?: string }) {
  const periodos = useMemo(() => periodosDisponibles(tipo, new Date()), [tipo]);
  const [periodo, setPeriodo] = useState(
    periodoInicial && periodos.includes(periodoInicial) ? periodoInicial : (periodos[0] ?? ''),
  );
  const [vista, setVista] = useState<Vista>('capturar');
  const {
    clave,
    valores,
    iniciales,
    versionForm,
    restaurado,
    pendiente,
    sinConexion,
    loading,
    error,
    recargar,
    guardar,
    guardarBorrador,
  } = useDatosDinero(tipo, periodo);
  const { resumenes, listo: resumenesListos } = useCambiosLocalesDinero();
  const formulario = FORMULARIOS[tipo];

  // Si el usuario se quedo a medias en un periodo, la pantalla abre en ese periodo (salvo que venga uno indicado).
  const yaElegido = useRef(Boolean(periodoInicial));
  useEffect(() => {
    if (yaElegido.current || !resumenesListos) return;
    yaElegido.current = true;
    const reciente = periodoMasReciente(resumenes, tipo);
    if (reciente && periodos.includes(reciente)) setPeriodo(reciente);
  }, [resumenesListos, resumenes, tipo, periodos]);

  // Periodos con algo escrito o guardado solo en este telefono: se marcan con un punto.
  const conCambios = useMemo(
    () => new Set(resumenes.filter((r) => r.tipo === tipo && (r.borrador || r.pendiente)).map((r) => r.periodo)),
    [resumenes, tipo],
  );
  const filas = filasParaCopiar(tipo, valores);
  const etiquetaDe = (p: string) => (tipo === 'anual' ? p : etiquetaPeriodo(tipo, p));

  // Las dos vistas siguen montadas (solo se ocultan): asi no se pierde lo escrito ni las marcas de "copiado".
  const oculta = (v: Vista) => (vista === v ? undefined : styles.oculto);

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      <PageHeader titulo={formulario.titulo} descripcion={formulario.descripcion} />
      <Note texto={MSG.dinero.aviso} icono="lock-closed-outline" />

      {periodos.length > 0 ? (
        <Section titulo={tipo === 'anual' ? 'Ejercicio' : 'Mes'}>
          <ChipRow>
            {periodos.map((p) => (
              <Chip
                key={p}
                titulo={etiquetaDe(p)}
                seleccionado={p === periodo}
                conAviso={conCambios.has(p)}
                accessibilityLabel={`${etiquetaDe(p)}${conCambios.has(p) ? ', con cambios sin enviar' : ''}`}
                onPress={() => setPeriodo(p)}
              />
            ))}
          </ChipRow>
        </Section>
      ) : null}

      {tipo === 'mensual' && periodo ? <AcumuladoDelAnio ejercicio={periodo.slice(0, 4)} /> : null}

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? (
        <View style={styles.bloque}>
          <FormMessage message={error} />
          <Button title="Reintentar" variant="secondary" loading={loading} onPress={recargar} />
        </View>
      ) : null}

      {!loading && !error ? (
        <>
          {restaurado || pendiente || sinConexion ? (
            <View style={styles.bloque}>
              {restaurado ? <FormMessage tone="info" message={MSG.dinero.restaurado} /> : null}
              {pendiente ? <FormMessage tone="info" message={MSG.dinero.pendiente} /> : null}
              {sinConexion && !pendiente ? <FormMessage tone="info" message={MSG.dinero.sinConexion} /> : null}
            </View>
          ) : null}

          <SegmentedControl
            valor={vista}
            onChange={setVista}
            opciones={[
              { id: 'capturar', titulo: 'Capturar' },
              { id: 'copiar', titulo: filas.length > 0 ? `Copiar (${filas.length})` : 'Copiar' },
            ]}
          />

          <View style={oculta('capturar')}>
            <Formulario
              key={`${clave}:${versionForm}`}
              tipo={tipo}
              ejercicio={tipo === 'anual' ? periodo : undefined}
              iniciales={iniciales}
              onGuardar={guardar}
              onCambio={guardarBorrador}
              onIrACopiar={() => setVista('copiar')}
            />
          </View>

          <View style={[styles.copiar, oculta('copiar')]}>
            <Note
              texto={`Orden orientativo: el portal puede presentarlo distinto. Toca cada dato para copiarlo y pégalo en el campo que corresponda. ${MSG.dinero.pesosEnteros}`}
              icono="bulb-outline"
            />
            {filas.length === 0 ? (
              <View style={styles.bloque}>
                <Text style={styles.descripcion}>{MSG.dinero.sinDatos}</Text>
                <Button title="Ir a capturar" variant="tonal" onPress={() => setVista('capturar')} />
              </View>
            ) : (
              <ListaParaCopiar key={clave} filas={filas} />
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

/** Espera tras la ultima tecla antes de guardar el borrador (evita escribir en el telefono en cada letra). */
const ESPERA_BORRADOR_MS = 500;

function Formulario({
  tipo,
  ejercicio,
  iniciales,
  onGuardar,
  onCambio,
  onIrACopiar,
}: {
  tipo: TipoDato;
  /** Solo en la declaracion anual: el ejercicio, para traer la suma de las mensuales. */
  ejercicio?: string;
  iniciales: Valores;
  onGuardar: (v: Valores) => Promise<ResultadoGuardado>;
  onCambio: (v: Valores) => Promise<void>;
  onIrACopiar: () => void;
}) {
  const formulario = FORMULARIOS[tipo];
  const esquema = useMemo(() => crearEsquemaDinero(tipo), [tipo]);
  const { control, handleSubmit, setValue } = useForm<Valores, unknown, Valores>({
    resolver: zodResolver(esquema),
    defaultValues: iniciales,
    mode: 'onBlur',
  });
  const actuales = useWatch({ control }) as Partial<Valores>;
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const resumen = totales(tipo, { ...valoresVacios(tipo), ...(actuales as Valores) });

  // Borrador: lo escrito se guarda en el telefono poco despues de cada cambio, y de inmediato si la app pasa a
  // segundo plano o se sale de la pantalla. Asi, si la app se cierra, el formulario reabre donde se quedo.
  const ultimos = useRef<Valores>(iniciales);
  const primera = useRef(true);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alCambiar = useCallback((v: Valores) => void onCambio(v), [onCambio]);

  useEffect(() => {
    ultimos.current = { ...valoresVacios(tipo), ...(actuales as Valores) };
    if (primera.current) {
      primera.current = false; // lo que se ve al abrir no es un cambio del usuario
      return;
    }
    const v = ultimos.current;
    temporizador.current = setTimeout(() => alCambiar(v), ESPERA_BORRADOR_MS);
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [actuales, tipo, alCambiar]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') alCambiar(ultimos.current);
    });
    return () => {
      suscripcion.remove();
      alCambiar(ultimos.current); // al salir de la pantalla o cambiar de periodo
    };
  }, [alCambiar]);

  const guardarDatos = async (datos: Valores) => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setMensaje(null);
    setErrorGuardar(null);
    try {
      const resultado = await onGuardar(datos);
      setMensaje(resultado === 'enviado' ? MSG.dinero.guardado : MSG.dinero.guardadoLocal);
    } catch (e) {
      setErrorGuardar(getDineroErrorMessage(e)); // el formulario conserva lo escrito
    }
  };

  return (
    <View style={styles.formulario}>
      <Note texto={formulario.nota} icono="bulb-outline" />

      {ejercicio ? (
        <ResumenDeMensuales
          ejercicio={ejercicio}
          actuales={actuales}
          onAplicar={(patch) => {
            for (const [id, valor] of Object.entries(patch)) setValue(id, valor, { shouldDirty: true });
          }}
        />
      ) : null}

      {formulario.secciones.map((seccion) => (
        <Section key={seccion.id} titulo={seccion.titulo}>
          <Card>
            {seccion.campos.map((campo) => (
              <FormTextField
                key={campo.id}
                control={control}
                name={campo.id}
                label={campo.etiqueta}
                helper={campo.ayuda}
                placeholder={campo.tipo === 'monto' ? '0.00' : undefined}
                keyboardType={campo.tipo === 'monto' ? 'decimal-pad' : campo.tipo === 'clabe' ? 'number-pad' : 'default'}
                maxLength={campo.tipo === 'clabe' ? 24 : 60}
                autoCorrect={false}
              />
            ))}
          </Card>
        </Section>
      ))}

      {resumen.length > 0 ? (
        <Card variante="tint">
          <View style={styles.resumen} accessibilityLiveRegion="polite">
            {resumen.map((t) => (
              <View key={t.id} style={styles.resumenFila}>
                <Text style={styles.resumenEtiqueta}>{t.etiqueta}</Text>
                <Text style={styles.resumenValor}>{formatearMonto(t.centavos)}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <View style={styles.bloque}>
        <FormMessage message={errorGuardar} />
        <FormMessage tone="info" message={mensaje} />
        <Button title="Guardar" onPress={handleSubmit(guardarDatos)} />
        {mensaje ? <Button title="Ir a copiar mis datos" variant="tonal" onPress={onIrACopiar} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  descripcion: { ...type.body, color: colors.muted },
  oculto: { display: 'none' },
  bloque: { gap: spacing.md },
  formulario: { gap: spacing.xl },
  copiar: { gap: spacing.lg },
  resumen: { gap: spacing.sm },
  resumenFila: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  resumenEtiqueta: { ...type.body, color: colors.ink, flex: 1 },
  resumenValor: { ...type.label, fontSize: 16, color: colors.ink },
});
