import { MESES } from '../recordatorios/nombres';
import {
  aCentavos,
  enmascararClabe,
  formatearMonto,
  montoParaCopiar,
  normalizarClabe,
  sumarCentavos,
  validarClabe,
} from './montos';

/**
 * Formularios de datos de dinero. Los conceptos de la declaracion anual siguen el articulo 151 de la Ley del ISR
 * (deducciones personales) y la estructura habitual: ingresos -> retenciones y pagos -> deducciones.
 *
 * El ORDEN y los NOMBRES son orientativos: el portal del SAT puede presentarlos distinto. El impuesto lo calcula
 * el propio portal; esta app solo organiza lo que el usuario ya sabe para copiarlo sin equivocarse.
 */

export type TipoDato = 'anual' | 'mensual' | 'cuenta';
export type TipoCampoDinero = 'monto' | 'clabe' | 'texto';

export type CampoDinero = {
  id: string;
  etiqueta: string;
  tipo: TipoCampoDinero;
  ayuda?: string;
  obligatorio?: boolean;
};

export type SeccionDinero = { id: string; titulo: string; campos: readonly CampoDinero[] };

export type TotalDefinido = { id: string; etiqueta: string; suma: readonly string[]; resta?: readonly string[] };

export type FormularioDinero = {
  tipo: TipoDato;
  titulo: string;
  descripcion: string;
  nota: string;
  secciones: readonly SeccionDinero[];
  totales: readonly TotalDefinido[];
};

const monto = (id: string, etiqueta: string, ayuda?: string): CampoDinero => ({ id, etiqueta, tipo: 'monto', ayuda });

export const FORMULARIOS: Record<TipoDato, FormularioDinero> = {
  anual: {
    tipo: 'anual',
    titulo: 'Declaración anual',
    descripcion: 'Ingresos, retenciones y deducciones personales del ejercicio.',
    nota:
      'Las deducciones personales tienen un límite conjunto (el menor entre cinco UMA anuales o el 15 % de tus ingresos); los donativos y las aportaciones de retiro tienen reglas propias, y las colegiaturas, topes por nivel educativo. El portal aplica esos límites: captura tus montos reales. Normalmente cada gasto necesita su factura (CFDI) a tu nombre.',
    secciones: [
      {
        id: 'ingresos',
        titulo: 'Ingresos del ejercicio',
        campos: [
          monto('ing_salarios', 'Sueldos y salarios'),
          monto('ing_honorarios', 'Honorarios y actividades profesionales o empresariales'),
          monto('ing_arrendamiento', 'Arrendamiento'),
          monto('ing_intereses', 'Intereses'),
          monto('ing_otros', 'Otros ingresos'),
        ],
      },
      {
        id: 'retenciones',
        titulo: 'ISR retenido y pagos',
        campos: [
          monto('isr_retenido', 'ISR retenido en el año', 'Lo muestra tu constancia de sueldos o tus recibos.'),
          monto('pagos_provisionales', 'Pagos provisionales de ISR del año'),
        ],
      },
      {
        id: 'deducciones',
        titulo: 'Deducciones personales',
        campos: [
          monto('ded_medicos', 'Honorarios médicos, dentales, de psicología y nutrición, y gastos hospitalarios'),
          monto('ded_funerarios', 'Gastos funerarios'),
          monto('ded_donativos', 'Donativos'),
          monto('ded_hipotecarios', 'Intereses reales de créditos hipotecarios'),
          monto('ded_retiro', 'Aportaciones complementarias y planes personales de retiro'),
          monto('ded_seguros', 'Primas de seguros de gastos médicos'),
          monto('ded_transporte', 'Transporte escolar obligatorio'),
          monto('ded_impuesto_local', 'Impuesto local sobre salarios'),
          monto('ded_colegiaturas', 'Colegiaturas'),
        ],
      },
    ],
    totales: [
      {
        id: 'total_ingresos',
        etiqueta: 'Total de ingresos',
        suma: ['ing_salarios', 'ing_honorarios', 'ing_arrendamiento', 'ing_intereses', 'ing_otros'],
      },
      {
        id: 'total_deducciones',
        etiqueta: 'Total de deducciones personales (antes de límites)',
        suma: [
          'ded_medicos',
          'ded_funerarios',
          'ded_donativos',
          'ded_hipotecarios',
          'ded_retiro',
          'ded_seguros',
          'ded_transporte',
          'ded_impuesto_local',
          'ded_colegiaturas',
        ],
      },
    ],
  },
  mensual: {
    tipo: 'mensual',
    titulo: 'Declaración mensual',
    descripcion: 'Ingresos, gastos, retenciones e IVA de un mes.',
    nota:
      'Qué campos usa tu declaración mensual depende de tu régimen y actividad; estos son los conceptos más comunes. El impuesto lo calcula el portal.',
    secciones: [
      { id: 'ingresos', titulo: 'Ingresos del mes', campos: [monto('ing_mes', 'Ingresos del mes')] },
      {
        id: 'gastos',
        titulo: 'Gastos y deducciones',
        campos: [monto('ded_mes', 'Gastos y deducciones autorizadas del mes')],
      },
      {
        id: 'retenciones',
        titulo: 'Retenciones y pagos',
        campos: [
          monto('isr_ret_mes', 'ISR retenido en el mes'),
          monto('pagos_ant', 'Pagos provisionales anteriores del año'),
        ],
      },
      {
        id: 'iva',
        titulo: 'IVA',
        campos: [
          monto('iva_cobrado', 'IVA cobrado (trasladado)'),
          monto('iva_pagado', 'IVA pagado (acreditable)'),
          monto('iva_retenido', 'IVA retenido'),
        ],
      },
    ],
    totales: [
      { id: 'total_ingresos', etiqueta: 'Ingresos', suma: ['ing_mes'] },
      { id: 'total_gastos', etiqueta: 'Gastos y deducciones', suma: ['ded_mes'] },
      { id: 'referencia', etiqueta: 'Referencia: ingresos menos gastos (no es el impuesto)', suma: ['ing_mes'], resta: ['ded_mes'] },
    ],
  },
  cuenta: {
    tipo: 'cuenta',
    titulo: 'Cuenta para devolución',
    descripcion: 'La cuenta bancaria donde quieres recibir un saldo a favor.',
    nota: 'Normalmente la cuenta debe estar a tu nombre. Revisa la CLABE: un dígito mal puesto retrasa la devolución.',
    secciones: [
      {
        id: 'cuenta',
        titulo: 'Cuenta bancaria',
        campos: [
          {
            id: 'clabe',
            etiqueta: 'CLABE interbancaria (18 dígitos)',
            tipo: 'clabe',
            obligatorio: true,
            ayuda: 'La encuentras en tu estado de cuenta o en la app de tu banco.',
          },
          { id: 'banco', etiqueta: 'Banco', tipo: 'texto' },
        ],
      },
    ],
    totales: [],
  },
};

// ------------------------------------------------------------ claves y periodos

/** Debe coincidir con el CHECK de supabase/006_captura_financiera.sql. */
export const CLAVE_VALIDA = /^(anual-\d{4}|mensual-\d{4}-(0[1-9]|1[0-2])|cuenta)$/;

export function esTipoDato(valor: unknown): valor is TipoDato {
  return valor === 'anual' || valor === 'mensual' || valor === 'cuenta';
}

export function claveDe(tipo: TipoDato, periodo: string): string {
  if (tipo === 'cuenta') return 'cuenta';
  return `${tipo}-${periodo}`;
}

/** anual: ejercicios (los ultimos 5, empezando por el anterior). mensual: ultimos 12 meses (YYYY-MM). cuenta: ninguno. */
export function periodosDisponibles(tipo: TipoDato, ahora: Date): string[] {
  if (tipo === 'cuenta') return [];
  if (tipo === 'anual') {
    const base = ahora.getFullYear() - 1;
    return Array.from({ length: 5 }, (_, i) => String(base - i));
  }
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

export function etiquetaPeriodo(tipo: TipoDato, periodo: string): string {
  if (tipo === 'anual') return `Ejercicio ${periodo}`;
  if (tipo === 'mensual') {
    const [y, m] = periodo.split('-');
    const mes = MESES[Number(m) - 1] ?? periodo;
    return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${y}`;
  }
  return '';
}

// ------------------------------------------------------------------ valores

export type Valores = Record<string, string>;

export function camposDe(tipo: TipoDato): CampoDinero[] {
  return FORMULARIOS[tipo].secciones.flatMap((s) => [...s.campos]);
}

export function valoresVacios(tipo: TipoDato): Valores {
  return Object.fromEntries(camposDe(tipo).map((c) => [c.id, '']));
}

/** Lo que llega de la base de datos puede estar mal formado: solo se aceptan campos conocidos, como texto y validos. */
export function sanearValores(tipo: TipoDato, crudo: unknown): Valores {
  const salida = valoresVacios(tipo);
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) return salida;
  const origen = crudo as Record<string, unknown>;
  for (const campo of camposDe(tipo)) {
    const v = origen[campo.id];
    if (typeof v !== 'string') continue;
    if (campo.tipo === 'monto' && aCentavos(v) === null) continue;
    if (campo.tipo === 'clabe' && validarClabe(v) !== null) continue;
    salida[campo.id] = v.slice(0, 60);
  }
  return salida;
}

export type TotalCalculado = { id: string; etiqueta: string; centavos: number };

export function totales(tipo: TipoDato, valores: Valores): TotalCalculado[] {
  const c = (id: string) => aCentavos(valores[id] ?? '');
  return FORMULARIOS[tipo].totales.map((t) => ({
    id: t.id,
    etiqueta: t.etiqueta,
    centavos: sumarCentavos(t.suma.map(c)) - sumarCentavos((t.resta ?? []).map(c)),
  }));
}

export type FilaCopia = {
  id: string;
  seccion: string;
  etiqueta: string;
  /** Lo que se copia al portapapeles. */
  copiar: string;
  /** Lo que se ve en pantalla. */
  mostrar: string;
  sensible: boolean;
};

/** Lista ordenada para copiar: solo los campos con valor, en el orden del formulario. */
export function filasParaCopiar(tipo: TipoDato, valores: Valores): FilaCopia[] {
  const filas: FilaCopia[] = [];
  for (const seccion of FORMULARIOS[tipo].secciones) {
    for (const campo of seccion.campos) {
      const crudo = (valores[campo.id] ?? '').trim();
      if (!crudo) continue;
      if (campo.tipo === 'monto') {
        const c = aCentavos(crudo);
        if (c === null) continue;
        filas.push({ id: campo.id, seccion: seccion.titulo, etiqueta: campo.etiqueta, copiar: montoParaCopiar(c), mostrar: formatearMonto(c), sensible: false });
      } else if (campo.tipo === 'clabe') {
        const clabe = normalizarClabe(crudo);
        if (validarClabe(clabe) !== null) continue;
        filas.push({ id: campo.id, seccion: seccion.titulo, etiqueta: campo.etiqueta, copiar: clabe, mostrar: enmascararClabe(clabe), sensible: true });
      } else {
        filas.push({ id: campo.id, seccion: seccion.titulo, etiqueta: campo.etiqueta, copiar: crudo, mostrar: crudo, sensible: false });
      }
    }
  }
  return filas;
}
