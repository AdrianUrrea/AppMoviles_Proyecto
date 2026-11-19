import { ListRow } from '@/components/ui/ListRow';
import { CATEGORIAS } from '@/tramites/catalogo';
import type { Tramite } from '@/tramites/catalogo';

type Props = {
  tramite: Tramite;
  onPress: () => void;
  /** Muestra la categoria sobre el titulo (en los resultados de busqueda, donde no hay encabezados por categoria). */
  mostrarCategoria?: boolean;
};

/** Fila de un tramite. Va dentro de GroupedList. */
export function TramiteItem({ tramite, onPress, mostrarCategoria = false }: Props) {
  const categoria = CATEGORIAS.find((c) => c.id === tramite.categoria)?.titulo;
  return (
    <ListRow
      titulo={tramite.titulo}
      descripcion={tramite.descripcion}
      etiqueta={mostrarCategoria ? categoria : undefined}
      onPress={onPress}
      accessibilityHint="Abre la guía del trámite"
    />
  );
}
