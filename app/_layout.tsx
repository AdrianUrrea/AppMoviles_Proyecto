import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SessionProvider, useSession } from '@/providers/SessionProvider';
import { configurarNotificaciones } from '@/services/notificaciones';

SplashScreen.preventAutoHideAsync();
configurarNotificaciones();

function RootNavigator() {
  const { status } = useSession();
  const router = useRouter();
  const anterior = useRef(status);

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  // Al iniciar o cerrar sesion, volver a "/" para que app/index.tsx envie a la pantalla correcta
  // (dashboard o login). Asi no dependemos de a donde redirija el guard por defecto.
  useEffect(() => {
    const previo = anterior.current;
    anterior.current = status;
    if (previo !== 'loading' && status !== 'loading' && previo !== status) {
      router.replace('/');
    }
  }, [status, router]);

  // Mientras se restaura la sesion se mantiene el splash.
  if (status === 'loading') return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SessionProvider>
  );
}
