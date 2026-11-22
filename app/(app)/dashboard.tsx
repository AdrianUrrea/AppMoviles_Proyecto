import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { SectionCard } from '@/components/ui/SectionCard';
import { SECCIONES } from '@/config/secciones';
import { useProfile } from '@/hooks/useProfile';
import { iniciales } from '@/perfil/logica';
import { useSession } from '@/providers/SessionProvider';
import { colors, spacing, type } from '@/theme';

/** Ventana en la que se ignoran toques repetidos (evita abrir la misma seccion dos veces). */
const VENTANA_TOQUE_MS = 700;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { perfil, loading, error, reintentar } = useProfile(user?.id);
  const ultimoToque = useRef(0);

  // La barra de estado es clara solo mientras esta pantalla esta a la vista (las demas pantallas tienen fondo claro).
  const [enfoque, setEnfoque] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setEnfoque(true);
      return () => setEnfoque(false);
    }, []),
  );

  const abrir = (ruta: string) => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < VENTANA_TOQUE_MS) return;
    ultimoToque.current = ahora;
    router.push(ruta);
  };

  return (
    <Screen
      espaciado={spacing.xl}
      hero={
        <View style={styles.heroFila}>
          <View style={styles.heroTextos}>
            <Text style={styles.heroSaludo}>Hola,</Text>
            <Text style={styles.heroNombre} numberOfLines={1} ellipsizeMode="tail">
              {perfil ? perfil.nombre : 'Bienvenido'}
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : perfil ? (
            <Pressable onPress={() => abrir('/perfil')} accessibilityRole="button" accessibilityLabel="Mi perfil" hitSlop={8}>
              <Avatar iniciales={iniciales(perfil.nombre, perfil.apellido_paterno)} tamano={52} invertido />
            </Pressable>
          ) : null}
        </View>
      }
    >
      {enfoque ? <StatusBar style="light" /> : null}

      {error ? (
        <View style={styles.errorBloque}>
          <FormMessage message="No pudimos cargar tu perfil." />
          <Button title="Reintentar" variant="secondary" loading={loading} onPress={reintentar} />
        </View>
      ) : null}

      <Text style={styles.pregunta} accessibilityRole="header">
        ¿Qué necesitas hacer hoy?
      </Text>

      {/* La primera tarjeta de ancho completo es la accion principal; las demas de ancho completo son accesos secundarios. */}
      <View style={styles.grid}>
        {SECCIONES.map((s, i) => (
          <SectionCard
            key={s.id}
            titulo={s.titulo}
            descripcion={s.descripcion}
            icono={s.icono}
            anchoCompleto={s.anchoCompleto}
            variante={s.anchoCompleto ? (i === 0 ? 'principal' : 'fila') : 'normal'}
            onPress={() => abrir(s.ruta)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  heroTextos: { flex: 1, gap: 2 },
  heroSaludo: { ...type.body, color: colors.onPrimaryMuted },
  heroNombre: { ...type.title, color: colors.onPrimary },
  heroCorreo: { ...type.caption, color: colors.onPrimaryMuted, marginTop: 2 },
  errorBloque: { gap: spacing.md },
  pregunta: { ...type.section, color: colors.ink, marginBottom: -spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
