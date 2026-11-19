import { Redirect } from 'expo-router';
import { useSession } from '@/providers/SessionProvider';

/** Punto de entrada: decide a donde enviar al usuario segun su sesion y si tiene un registro pendiente. */
export default function Index() {
  const { status, pendingEmail } = useSession();

  if (status === 'signedIn') return <Redirect href="/dashboard" />;

  // Cerro la app sin confirmar el correo: volver a la pantalla de confirmacion.
  if (pendingEmail) {
    return <Redirect href={{ pathname: '/verify-email', params: { correo: pendingEmail, restaurado: '1' } }} />;
  }

  return <Redirect href="/login" />;
}
