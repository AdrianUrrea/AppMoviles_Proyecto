import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField, FormTimeField } from '@/components/form';
import { RecordatorioItem } from '@/components/RecordatorioItem';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { useRecordatoriosRango } from '@/hooks/useRecordatorios';
import { confirmar } from '@/lib/confirmar';
import { crearEsquemaRecordatorio } from '@/recordatorios/esquema';
import type { RecordatorioData, RecordatorioFormValues } from '@/recordatorios/esquema';
import {
  capitalizar,
  combinarFechaHora,
  fechaEsPasada,
  formatearFechaLarga,
} from '@/recordatorios/logica';
import type { Recordatorio } from '@/recordatorios/logica';
import { crearRecordatorio, eliminarRecordatorio, getRecordatorioErrorMessage } from '@/services/recordatorios';
import { avisoDeAgendado, cancelarRecordatorio, pedirPermiso, programarRecordatorio } from '@/services/notificaciones';
import { parseFechaIso } from '@/validation/fechas';
import type { FechaIso } from '@/validation/fechas';
import { MSG } from '@/validation/mensajes';
import { colors, spacing, type } from '@/theme';

export default function CalendarioDiaScreen() {
  const { fecha } = useLocalSearchParams<{ fecha?: string }>();
  const f = fecha ? parseFechaIso(fecha) : null;
  if (!fecha || !f) return <Redirect href="/calendario" />;
  return <DiaContenido fecha={fecha} f={f} />;
}

function DiaContenido({ fecha, f }: { fecha: string; f: FechaIso }) {
  const desdeMs = new Date(f.y, f.m - 1, f.d).getTime();
  const hastaMs = new Date(f.y, f.m - 1, f.d + 1).getTime();
  const { items, loading, error: errorLista, recargar } = useRecordatoriosRango(desdeMs, hastaMs);

  const esquema = useMemo(() => crearEsquemaRecordatorio(fecha), [fecha]);
  const esPasado = fechaEsPasada(fecha, new Date());

  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [claveForm, setClaveForm] = useState(0); // reinicia los campos de hora tras guardar

  const { control, handleSubmit, reset, setError } = useForm<RecordatorioFormValues, unknown, RecordatorioData>({
    resolver: zodResolver(esquema),
    defaultValues: { titulo: '', hora: '' },
    mode: 'onBlur',
  });

  const agendar = async (datos: RecordatorioData) => {
    setErrorAccion(null);
    setAviso(null);
    setSinPermiso(false);

    const fechaHora = combinarFechaHora(fecha, datos.hora);
    if (!fechaHora) {
      setError('hora', { message: MSG.recordatorio.hora.invalida });
      return;
    }

    let recordatorio: Recordatorio;
    try {
      recordatorio = await crearRecordatorio(datos.titulo, fechaHora);
    } catch (e) {
      setErrorAccion(getRecordatorioErrorMessage(e)); // el formulario conserva lo escrito
      return;
    }

    reset({ titulo: '', hora: '' });
    setClaveForm((k) => k + 1);
    recargar();

    // El recordatorio ya esta guardado; lo que sigue son los avisos del telefono.
    try {
      const permiso = await pedirPermiso();
      if (permiso === 'denegado') {
        setSinPermiso(true);
        return;
      }
      if (permiso === 'no_disponible') {
        setAviso(MSG.recordatorio.notificacionesNoDisponibles);
        return;
      }
      await programarRecordatorio(recordatorio);
      await avisoDeAgendado(recordatorio);
    } catch {
      setAviso('Guardamos tu recordatorio, pero no pudimos programar el aviso en tu teléfono.');
    }
  };

  const eliminar = async (r: Recordatorio) => {
    setErrorAccion(null);
    if (!(await confirmar('Eliminar recordatorio', `¿Eliminar "${r.titulo}"?`))) return;
    setEliminandoId(r.id);
    try {
      await eliminarRecordatorio(r.id);
    } catch (e) {
      setErrorAccion(getRecordatorioErrorMessage(e));
      setEliminandoId(null);
      return;
    }
    try {
      await cancelarRecordatorio(r.id);
    } catch {
      // Si no se pudo cancelar el aviso local, la proxima sincronizacion lo limpia.
    }
    setEliminandoId(null);
    recargar();
  };

  return (
    <Screen conEncabezado>
      <Text style={styles.titulo}>{capitalizar(formatearFechaLarga(f))}</Text>

      <View style={styles.lista}>
        {loading && items.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
        {errorLista ? (
          <>
            <FormMessage message={errorLista} />
            <Button title="Reintentar" variant="secondary" loading={loading} onPress={recargar} />
          </>
        ) : null}
        {!loading && !errorLista && items.length === 0 ? (
          <Text style={styles.vacio}>No tienes recordatorios este día.</Text>
        ) : null}
        {items.map((r) => (
          <RecordatorioItem
            key={r.id}
            recordatorio={r}
            eliminando={eliminandoId === r.id}
            onEliminar={() => eliminar(r)}
          />
        ))}
      </View>

      <FormMessage message={errorAccion} />
      <FormMessage message={aviso} tone="info" />
      {sinPermiso ? (
        <View style={styles.permiso}>
          <FormMessage
            tone="info"
            message="Guardamos tu recordatorio, pero no recibirás notificaciones porque el permiso está desactivado."
          />
          <Button title="Abrir ajustes del teléfono" variant="secondary" onPress={() => Linking.openSettings()} />
        </View>
      ) : null}

      <Text style={styles.seccion}>Nuevo recordatorio</Text>
      {esPasado ? (
        <Text style={styles.vacio}>{MSG.recordatorio.fechaPasada}</Text>
      ) : (
        <>
          <FormTextField control={control} name="titulo" label="Título" maxLength={80} autoCapitalize="sentences" />
          <FormTimeField
            key={claveForm}
            control={control}
            name="hora"
            label="Hora"
            helper="Formato de 24 horas, por ejemplo 14:30."
          />
          <Button title="Agendar recordatorio" onPress={handleSubmit(agendar)} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { ...type.title, color: colors.ink },
  lista: { gap: spacing.sm },
  vacio: { ...type.body, color: colors.muted },
  permiso: { gap: spacing.md },
  seccion: { ...type.section, color: colors.ink, marginTop: spacing.sm },
});
