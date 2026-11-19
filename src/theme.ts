export const colors = {
  background: '#F5F6F3',
  surface: '#FFFFFF',
  ink: '#17231E',
  muted: '#5A6A63',
  placeholder: '#8A9892',
  /** Borde de campos de formulario. */
  border: '#C9D2CD',
  /** Borde de tarjetas y listas (mas suave que el de los campos). */
  line: '#DCE3DE',
  /** Separador entre filas dentro de una lista. */
  divider: '#E8EDEA',
  /** Fondo suave del color de marca: iconos, filas presionadas, avisos. */
  tint: '#E6EEEA',
  tintStrong: '#CFE0D7',
  primary: '#1E5A48',
  primaryPressed: '#16453A',
  onPrimary: '#FFFFFF',
  danger: '#B3261E',
  dangerTint: '#FBEAE8',
  focus: '#1E5A48',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const type = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  /** Titulo de pantalla de detalle. */
  heading: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  /** Titulo de una seccion dentro de una pantalla. */
  section: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

/** Sombra muy leve para separar las tarjetas del fondo (en Android se usa elevation). */
export const shadow = {
  card: {
    shadowColor: '#17231E',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
} as const;
