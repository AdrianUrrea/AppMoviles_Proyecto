export const colors = {
  background: '#F4F6F4',
  surface: '#FFFFFF',
  ink: '#14211B',
  muted: '#566860',
  placeholder: '#7C8A84',
  /** Borde de campos de formulario. */
  border: '#C4CEC8',
  /** Borde de tarjetas y listas (mas suave que el de los campos). */
  line: '#DDE4DF',
  /** Separador entre filas dentro de una lista. */
  divider: '#E9EEEB',
  /** Fondo suave del color de marca: iconos, filas presionadas, avisos. */
  tint: '#E8F0EC',
  tintStrong: '#D2E3DA',
  primary: '#1E5A48',
  primaryPressed: '#154536',
  onPrimary: '#FFFFFF',
  /** Texto secundario sobre fondos del color de marca (encabezados). */
  onPrimaryMuted: 'rgba(255,255,255,0.82)',
  danger: '#B3261E',
  dangerTint: '#FBEAE8',
  /** Algo salio bien (copiado, guardado). */
  success: '#17714A',
  successTint: '#E2F2E9',
  /** "Revisa esto": datos que se dedujeron o pueden estar mal leidos. No es un error. */
  warning: '#8A5200',
  warningTint: '#FCF0DA',
  focus: '#1E5A48',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 18, xl: 28, pill: 999 } as const;

export const type = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4 },
  /** Titulo de pantalla de detalle. */
  heading: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  /** Titulo de una seccion dentro de una pantalla. */
  section: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  /** Rotulo pequeño en mayusculas para agrupar (por ejemplo, el nombre de una seccion de datos). */
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
} as const;

/** Cifras con el mismo ancho para que los montos se alineen y se lean bien. */
export const cifras = { fontVariant: ['tabular-nums'] } as const;

/** Sombras suaves para separar las tarjetas del fondo (en Android se usa elevation). */
export const shadow = {
  card: {
    shadowColor: '#14211B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  /** Elementos que deben destacar: boton principal, tarjeta principal. */
  raised: {
    shadowColor: '#0F3D31',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;
