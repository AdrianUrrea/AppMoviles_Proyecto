import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useSincronizarDinero } from '@/hooks/useSincronizarDinero';
import { useSincronizarRecordatorios } from '@/hooks/useSincronizarRecordatorios';
import { esToqueEnNotificacion, useUltimaRespuestaNotificacion } from '@/services/notificaciones';
import { parseFechaIso } from '@/validation/fechas';
import { colors } from '@/theme';

export default function AppLayout() {
  const router = useRouter();
  const ultimaAtendida = useRef<string | null>(null);

  // Mantiene los avisos del telefono al dia con los recordatorios guardados.
  useSincronizarRecordatorios();

  // Envia a la cuenta los datos de dinero guardados sin conexion.
  useSincronizarDinero();

  // Al tocar una notificacion (tambien si abrio la app), ir al dia del recordatorio.
  const respuesta = useUltimaRespuestaNotificacion();
  useEffect(() => {
    if (!respuesta) return;
    if (!esToqueEnNotificacion(respuesta)) return;
    const clave = `${respuesta.notification.request.identifier}:${respuesta.notification.date}`;
    if (ultimaAtendida.current === clave) return;
    ultimaAtendida.current = clave;
    const fecha = respuesta.notification.request.content.data?.fecha;
    if (typeof fecha === 'string' && parseFechaIso(fecha)) {
      router.push({ pathname: '/calendario-dia', params: { fecha } });
    }
  }, [respuesta, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.ink },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="tramites" options={{ title: 'Trámites SAT' }} />
      <Stack.Screen name="tramite-detalle" options={{ title: 'Trámite' }} />
      <Stack.Screen name="datos-dinero" options={{ title: 'Datos de dinero' }} />
      <Stack.Screen name="datos-dinero-editor" options={{ title: 'Capturar datos' }} />
      <Stack.Screen name="documentos" options={{ title: 'Documentos' }} />
      <Stack.Screen name="documento-nuevo" options={{ title: 'Nuevo documento' }} />
      <Stack.Screen name="documento-detalle" options={{ title: 'Documento' }} />
      <Stack.Screen name="calendario" options={{ title: 'Calendario' }} />
      <Stack.Screen name="calendario-dia" options={{ title: 'Recordatorios' }} />
      <Stack.Screen name="guias" options={{ title: 'Guías' }} />
      <Stack.Screen name="guia-detalle" options={{ title: 'Guía' }} />
      <Stack.Screen name="perfil" options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="perfil-domicilio" options={{ title: 'Editar domicilio' }} />
      <Stack.Screen name="perfil-password" options={{ title: 'Cambiar contraseña' }} />
    </Stack>
  );
}
