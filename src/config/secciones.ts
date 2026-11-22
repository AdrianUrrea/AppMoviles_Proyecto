import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type SeccionId = 'tramites' | 'documentos' | 'calendario' | 'guias' | 'perfil';

export type Seccion = {
  id: SeccionId;
  titulo: string;
  descripcion: string;
  icono: ComponentProps<typeof Ionicons>['name'];
  /** Debe ser "/" + id, y existir como archivo en app/(app)/<id>.tsx */
  ruta: string;
  /** La tarjeta ocupa todo el ancho de la cuadricula. */
  anchoCompleto?: boolean;
};

/**
 * Secciones que aparecen como tarjetas en el dashboard, en este orden.
 * Para agregar una: sumar una entrada aqui, crear app/(app)/<id>.tsx y declararla en app/(app)/_layout.tsx.
 */
export const SECCIONES: readonly Seccion[] = [
  {
    id: 'tramites',
    titulo: 'Trámites SAT',
    descripcion: 'Prepara tus datos y abre el portal del SAT.',
    icono: 'receipt-outline',
    ruta: '/tramites',
    anchoCompleto: true,
  },
  {
    id: 'documentos',
    titulo: 'Documentos',
    descripcion: 'Consulta y organiza tus documentos.',
    icono: 'document-text-outline',
    ruta: '/documentos',
  },
  {
    id: 'calendario',
    titulo: 'Calendario',
    descripcion: 'Fechas importantes y recordatorios.',
    icono: 'calendar-outline',
    ruta: '/calendario',
  },
  {
    id: 'guias',
    titulo: 'Guías',
    descripcion: 'Aprende paso a paso.',
    icono: 'book-outline',
    ruta: '/guias',
  },
  {
    id: 'perfil',
    titulo: 'Mi perfil',
    descripcion: 'Tus datos, contraseña y sesión.',
    icono: 'person-outline',
    ruta: '/perfil',
  },
];
