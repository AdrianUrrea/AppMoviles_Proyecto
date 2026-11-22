import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useSession } from '@/providers/SessionProvider';
import { getErrorMessage, resendCode, verifyCode } from '@/services/auth';
import { LONGITUD_CODIGO } from '@/validation/codigo';
import { codigoSchema } from '@/validation/login';
import { colors, spacing } from '@/theme';

const ESPERA_REENVIO = 60; // segundos

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { correo, restaurado } = useLocalSearchParams<{ correo?: string; restaurado?: string }>();
  const { setPendingEmail } = useSession();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(restaurado === '1' ? 0 : ESPERA_REENVIO); // restaurada al reabrir: el codigo se envio hace rato

  useEffect(() => {
    if (segundos <= 0) return;
    const id = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [segundos]);

  // Sin correo en los parametros no hay nada que confirmar.
  if (!correo) return <Redirect href="/login" />;

  const confirmar = async () => {
    setError(null);
    setInfo(null);
    const r = codigoSchema.safeParse({ codigo });
    if (!r.success) {
      setError(r.error.issues[0]?.message ?? null);
      return;
    }
    try {
      await verifyCode(correo, r.data.codigo);
      // Si es correcto, Supabase abre la sesion y el guard de rutas lleva al dashboard.
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const reenviar = async () => {
    setError(null);
    setInfo(null);
    try {
      await resendCode(correo);
      setInfo('Te enviamos un nuevo código.');
      setSegundos(ESPERA_REENVIO);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <Screen>
      <AuthHeader
        titulo="Confirma tu correo"
        subtitulo={
          <>
            Enviamos un código de {LONGITUD_CODIGO} dígitos a <Text style={styles.correo}>{correo}</Text>. Vence en 15 minutos.
          </>
        }
      />

      <TextField
        label="Código de confirmación"
        value={codigo}
        onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, LONGITUD_CODIGO))}
        placeholder={'12345678901234567890'.slice(0, LONGITUD_CODIGO)}
        keyboardType="number-pad"
        maxLength={LONGITUD_CODIGO}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        helper="Revisa también la carpeta de spam."
      />

      <FormMessage message={error} />
      <FormMessage message={info} tone="info" />

      <Button title="Confirmar" onPress={confirmar} />
      <Button
        title={segundos > 0 ? `Reenviar código en ${segundos} s` : 'Reenviar código'}
        variant="secondary"
        disabled={segundos > 0}
        onPress={reenviar}
      />

      <View style={styles.salidas}>
        <Button title="Corregir mi correo" variant="text" onPress={() => {
            setPendingEmail(null);
            router.dismissTo('/register');
          }} />
        <Button title="Volver al inicio de sesión" variant="text" onPress={() => {
            setPendingEmail(null);
            router.dismissTo('/login');
          }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  correo: { fontWeight: '700', color: colors.ink },
  salidas: { marginTop: spacing.sm },
});
