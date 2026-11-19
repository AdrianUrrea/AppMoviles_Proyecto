import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { GroupedList } from '@/components/ui/GroupedList';
import { ListRow } from '@/components/ui/ListRow';
import { Note } from '@/components/ui/Note';
import { Screen } from '@/components/ui/Screen';
import { ICONO_DINERO } from '@/config/iconosDinero';
import { FORMULARIOS } from '@/dinero/formularios';
import type { TipoDato } from '@/dinero/formularios';
import { MSG } from '@/validation/mensajes';
import { spacing } from '@/theme';

const VENTANA_TOQUE_MS = 700;
const TIPOS: readonly TipoDato[] = ['anual', 'mensual', 'cuenta'];

export default function DatosDineroScreen() {
  const router = useRouter();
  const ultimoToque = useRef(0);

  const abrir = (tipo: TipoDato) => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < VENTANA_TOQUE_MS) return;
    ultimoToque.current = ahora;
    router.push({ pathname: '/datos-dinero-editor', params: { tipo } });
  };

  return (
    <Screen conEncabezado espaciado={spacing.xl}>
      <Note texto={MSG.dinero.aviso} icono="lock-closed-outline" />
      <GroupedList>
        {TIPOS.map((tipo) => (
          <ListRow
            key={tipo}
            icono={ICONO_DINERO[tipo]}
            titulo={FORMULARIOS[tipo].titulo}
            descripcion={FORMULARIOS[tipo].descripcion}
            onPress={() => abrir(tipo)}
          />
        ))}
      </GroupedList>
    </Screen>
  );
}
