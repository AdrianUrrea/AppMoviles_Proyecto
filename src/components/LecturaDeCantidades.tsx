import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { ListaParaCopiar } from '@/components/ListaParaCopiar';
import { Note } from '@/components/ui/Note';
import { Section } from '@/components/ui/Section';
import { contarPorTipo, filasDeCantidades } from '@/documentos/cantidades';
import { useLecturaDeCantidades } from '@/hooks/useLecturaDeCantidades';
import type { ImagenParaLeer } from '@/hooks/useLecturaDeCantidades';
import { lecturaDisponible } from '@/services/ocr';
import { MSG } from '@/validation/mensajes';
import { colors, type } from '@/theme';

export type { ImagenParaLeer };

type Props = {
  obtenerImagen: () => Promise<ImagenParaLeer>;
  /** Nombre del documento, para decir de donde se leyeron los datos. */
  nombreDocumento?: string;
};

/**
 * Boton "Leer montos y fechas" y, al terminar, la lista de lo encontrado para copiar y pegar en un formulario.
 * La lectura es siempre a peticion del usuario y se hace en el telefono.
 */
export function LecturaDeCantidades({ obtenerImagen, nombreDocumento }: Props) {
  const disponible = useMemo(() => lecturaDisponible(), []);
  const { cantidades, leyendo, error, lecturas, leer: leerImagen } = useLecturaDeCantidades(obtenerImagen);
  const [verOtros, setVerOtros] = useState(false);

  const leer = async () => {
    await leerImagen();
    setVerOtros(false);
  };

  if (!disponible) {
    return (
      <Note
        texto={`${MSG.documento.lectura.noDisponible}${__DEV__ ? ' (Desarrollo: requiere una development build; no funciona en Expo Go.)' : ''}`}
      />
    );
  }

  const { montos, fechas, otros } = cantidades ? contarPorTipo(cantidades) : { montos: 0, fechas: 0, otros: 0 };
  const filas = cantidades ? filasDeCantidades(cantidades, verOtros) : [];

  return (
    <Section
      titulo="Montos y fechas del documento"
      ayuda={
        nombreDocumento
          ? `Leídos de “${nombreDocumento}” en tu teléfono, para que los copies a tus formularios.`
          : 'Se leen en tu teléfono para que los copies a tus formularios.'
      }
    >
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
          {montos === 0 && fechas === 0 && otros === 0 ? <FormMessage message={MSG.documento.lectura.sinCantidades} /> : null}
          {montos === 0 && fechas === 0 && otros > 0 ? <Text style={styles.nota}>{MSG.documento.lectura.soloOtros}</Text> : null}
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
