import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { SectionCard } from '@/components/ui/SectionCard';
import { SECCIONES } from '@/config/secciones';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/providers/SessionProvider';
import { colors, spacing, type } from '@/theme';

/** Ventana en la que se ignoran toques repetidos (evita abrir la misma seccion dos veces). */
const VENTANA_TOQUE_MS = 700;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { perfil, loading, error, reintentar } = useProfile(user?.id);
  const ultimoToque = useRef(0);

  const abrir = (ruta: string) => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < VENTANA_TOQUE_MS) return;
    ultimoToque.current = ahora;
    router.push(ruta);
  };

  return (
    <Screen espaciado={spacing.xl}>
      <View style={styles.header}>
        <View style={styles.saludoFila}>
          <Text style={styles.saludo} numberOfLines={1} ellipsizeMode="tail">
            {perfil ? `Hola, ${perfil.nombre}` : 'Hola'}
          </Text>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
        <Text style={styles.correo} numberOfLines={1} ellipsizeMode="middle">
          {user?.email}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBloque}>
          <FormMessage message="No pudimos cargar tu perfil." />
          <Button title="Reintentar" variant="secondary" loading={loading} onPress={reintentar} />
        </View>
      ) : null}

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
  header: { gap: 2, marginTop: spacing.md },
  saludoFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  saludo: { ...type.title, color: colors.ink, flexShrink: 1 },
  correo: { ...type.body, color: colors.muted },
  errorBloque: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
