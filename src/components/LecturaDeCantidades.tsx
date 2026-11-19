import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { ListaParaCopiar } from '@/components/ListaParaCopiar';
import { Note } from '@/components/ui/Note';
import { Section } from '@/components/ui/Section';
import { contarPorTipo, extraerCantidades, filasDeCantidades } from '@/documentos/cantidades';
import type { CantidadEncontrada } from '@/documentos/cantidades';
import { esErrorDeRed } from '@/lib/errores';
import { logDev } from '@/lib/log';
import { lecturaDisponible, leerTextoDeImagen } from '@/services/ocr';
import { DOCUMENTO_MESSAGES, MSG } from '@/validation/mensajes';
import { colors, type } from '@/theme';

/** Imagen local lista para leer. `limpiar` borra el archivo temporal si hubo que descargarlo. */
export type ImagenParaLeer = { uri: string; limpiar?: () => void };

type Props = { obtenerImagen: () => Promise<ImagenParaLeer> };

/**
 * Boton "Leer cantidades" y, al terminar, la lista de cantidades encontradas para copiar y pegar en un formulario.
 * La lectura es siempre a peticion del usuario y se hace en el telefono.
 */
export function LecturaDeCantidades({ obtenerImagen }: Props) {
  const disponible = useMemo(() => lecturaDisponible(), []);
  const [leyendo, setLeyendo] = useState(false);
  const [cantidades, setCantidades] = useState<CantidadEncontrada[] | null>(null);
  const [lecturas, setLecturas] = useState(0); // reinicia las marcas de "copiado" en cada lectura nueva
  const [verOtros, setVerOtros] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leer = async () => {
    setError(null);
    setLeyendo(true);
    let imagen: ImagenParaLeer | null = null;
    try {
      imagen = await obtenerImagen();
      const texto = await leerTextoDeImagen(imagen.uri);
      setCantidades(extraerCantidades(texto));
      setLecturas((n) => n + 1);
      setVerOtros(false);
    } catch (e) {
      logDev('lectura-cantidades', e);
      setError(esErrorDeRed(e) ? DOCUMENTO_MESSAGES.NETWORK : MSG.documento.lectura.error);
    } finally {
      imagen?.limpiar?.();
      setLeyendo(false);
    }
  };

  if (!disponible) {
    return (
      <Note
        texto={`${MSG.documento.lectura.noDisponible}${__DEV__ ? ' (Desarrollo: requiere una development build; no funciona en Expo Go.)' : ''}`}
      />
    );
  }

  const { montos, otros } = cantidades ? contarPorTipo(cantidades) : { montos: 0, otros: 0 };
  const filas = cantidades ? filasDeCantidades(cantidades, verOtros) : [];

  return (
    <Section titulo="Cantidades del documento" ayuda="Se leen en tu teléfono para que las copies a tus formularios.">
      <Button
        title={cantidades ? 'Leer de nuevo' : MSG.documento.lectura.boton}
        variant={cantidades ? 'secondary' : 'primary'}
        loading={leyendo}
        onPress={leer}
      />
      {leyendo ? <Text style={styles.nota}>{MSG.documento.lectura.leyendo}</Text> : null}
      <FormMessage message={error} />

      {cantidades && !leyendo ? (
        <>
          <Note texto={MSG.documento.lectura.aviso} />
          {montos === 0 && otros === 0 ? <FormMessage message={MSG.documento.lectura.sinCantidades} /> : null}
          {montos === 0 && otros > 0 ? <Text style={styles.nota}>{MSG.documento.lectura.soloOtros}</Text> : null}
          {filas.length > 0 ? <ListaParaCopiar key={`${lecturas}-${verOtros ? 'o' : 'm'}`} filas={filas} /> : null}
          {otros > 0 ? (
            <Button
              title={verOtros ? 'Ocultar otros números' : `Mostrar otros números (${otros})`}
              variant="text"
              onPress={() => setVerOtros((v) => !v)}
            />
          ) : null}
        </>
      ) : null}
    </Section>
  );
}

const styles = StyleSheet.create({
  nota: { ...type.caption, color: colors.muted },
});
