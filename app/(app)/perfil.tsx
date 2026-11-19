import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { DatoCopiable } from '@/components/DatoCopiable';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { GroupedList } from '@/components/ui/GroupedList';
import { ListRow } from '@/components/ui/ListRow';
import { Note } from '@/components/ui/Note';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { usePerfilCompleto } from '@/hooks/usePerfilCompleto';
import { iniciales, nombreCompleto } from '@/perfil/logica';
import { filasDeDatos } from '@/tramites/logica';
import type { CampoPerfil } from '@/tramites/logica';
import { MSG } from '@/validation/mensajes';
import { colors, spacing, type } from '@/theme';

const DATOS_PERSONALES: readonly CampoPerfil[] = ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'rfc', 'nacimiento', 'correo'];
const DOMICILIO: readonly CampoPerfil[] = ['calle', 'numExt', 'numInt', 'colonia', 'cp', 'municipio', 'estado'];

/** Cuanto tiempo se muestra "Domicilio actualizado." al volver de editar. */
const AVISO_MS = 4000;

export default function PerfilScreen() {
  const router = useRouter();
  const { guardado } = useLocalSearchParams<{ guardado?: string }>();
  const { perfil, loading, error, reintentar } = usePerfilCompleto();

  // Al volver de editar el domicilio, se recarga el perfil (la primera vez ya lo cargo el hook).
  const primeraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) primeraVez.current = false;
      else reintentar();
    }, [reintentar]),
  );

  // El aviso de "guardado" llega como parametro de la ruta y se quita solo.
  useEffect(() => {
    if (!guardado) return;
    const t = setTimeout(() => router.setParams({ guardado: '' }), AVISO_MS);
    return () => clearTimeout(t);
  }, [guardado, router]);

  const personales = perfil ? filasDeDatos(perfil, DATOS_PERSONALES) : [];
  const domicilio = perfil ? filasDeDatos(perfil, DOMICILIO) : [];

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      {perfil ? (
        <View style={styles.cabecera}>
          <Avatar iniciales={iniciales(perfil.nombre, perfil.apellido_paterno)} />
          <View style={styles.cabeceraTexto}>
            <Text style={styles.nombre}>{nombreCompleto(perfil)}</Text>
            <Text style={styles.correo} numberOfLines={1} ellipsizeMode="middle">
              {perfil.correo}
            </Text>
          </View>
        </View>
      ) : null}

      {loading && !perfil ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? (
        <View style={styles.bloque}>
          <FormMessage message={error} />
          <Button title="Reintentar" variant="secondary" loading={loading} onPress={reintentar} />
        </View>
      ) : null}
      {!loading && !error && !perfil ? <Text style={styles.texto}>{MSG.tramites.sinPerfil}</Text> : null}

      {guardado ? <FormMessage tone="info" message={MSG.perfil.domicilioGuardado} /> : null}

      {perfil ? (
        <>
          <Section titulo="Datos personales" ayuda="Toca un dato para copiarlo.">
            <GroupedList>
              {personales.map((f) => (
                <DatoCopiable key={f.campo} etiqueta={f.etiqueta} valor={f.valor} />
              ))}
            </GroupedList>
            <Note texto={MSG.perfil.soloLectura} icono="lock-closed-outline" />
          </Section>

          <Section titulo="Domicilio">
            <GroupedList>
              {domicilio.map((f) => (
                <DatoCopiable key={f.campo} etiqueta={f.etiqueta} valor={f.valor} />
              ))}
            </GroupedList>
            <Button title="Editar domicilio" variant="tonal" onPress={() => router.push('/perfil-domicilio')} />
            <Note texto={MSG.perfil.domicilioAviso} />
            <GroupedList>
              <ListRow
                icono="home-outline"
                titulo="Cambio de domicilio ante el SAT"
                descripcion="Guía para actualizarlo en el portal"
                onPress={() => router.push({ pathname: '/tramite-detalle', params: { id: 'cambio-domicilio' } })}
              />
            </GroupedList>
          </Section>

          <Section titulo="Cuenta">
            <GroupedList>
              <ListRow
                icono="settings-outline"
                titulo="Contraseña y sesión"
                descripcion="Configuración de tu cuenta"
                onPress={() => router.push('/configuracion')}
              />
            </GroupedList>
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm },
  cabeceraTexto: { flex: 1, gap: 2 },
  nombre: { ...type.heading, color: colors.ink },
  correo: { ...type.body, color: colors.muted },
  bloque: { gap: spacing.md },
  texto: { ...type.body, color: colors.muted },
});
