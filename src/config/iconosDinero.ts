import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { TipoDato } from '@/dinero/formularios';

/** Icono de cada formulario de "Mis datos de dinero" (se usa en la lista y en el detalle de los tramites). */
export const ICONO_DINERO: Record<TipoDato, ComponentProps<typeof Ionicons>['name']> = {
  anual: 'cash-outline',
  mensual: 'calendar-outline',
  cuenta: 'card-outline',
};
