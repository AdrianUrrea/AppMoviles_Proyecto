/** Logica pura de Tramites SAT (sin dependencias de la app: facil de probar). */

export type CampoPerfil =
  | 'nombre'
  | 'apellidoPaterno'
  | 'apellidoMaterno'
  | 'rfc'
  | 'correo'
  | 'nacimiento'
  | 'calle'
  | 'numExt'
  | 'numInt'
  | 'colonia'
  | 'cp'
  | 'municipio'
  | 'estado';

/** Fila de la tabla usuario (columnas que usan los tramites). */
export type FilaPerfil = {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo: string;
  rfc: string;
  nacimiento: string; // YYYY-MM-DD
  calle: string;
  num_ext: string;
  num_int: string | null;
  colonia: string;
  cp: string;
  municipio: string;
  estado: string;
};

export type GrupoDato = 'identidad' | 'domicilio';

/** Nombres como los muestra el SAT en sus formularios. */
export const ETIQUETAS: Record<CampoPerfil, string> = {
  nombre: 'Nombre(s)',
  apellidoPaterno: 'Primer apellido',
  apellidoMaterno: 'Segundo apellido',
  rfc: 'RFC',
  correo: 'Correo electrónico',
  nacimiento: 'Fecha de nacimiento',
  calle: 'Calle',
  numExt: 'Número exterior',
  numInt: 'Número interior',
  colonia: 'Colonia',
  cp: 'Código postal',
  municipio: 'Municipio o alcaldía',
  estado: 'Entidad federativa',
};

export const GRUPOS: Record<CampoPerfil, GrupoDato> = {
  nombre: 'identidad',
  apellidoPaterno: 'identidad',
  apellidoMaterno: 'identidad',
  rfc: 'identidad',
  correo: 'identidad',
  nacimiento: 'identidad',
  calle: 'domicilio',
  numExt: 'domicilio',
  numInt: 'domicilio',
  colonia: 'domicilio',
  cp: 'domicilio',
  municipio: 'domicilio',
  estado: 'domicilio',
};

/** "1990-03-05" -> "05/03/1990" (formato de los formularios del SAT). Si no es una fecha ISO, la devuelve tal cual. */
export function formatearFechaSat(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function valorDeCampo(p: FilaPerfil, campo: CampoPerfil): string {
  switch (campo) {
    case 'nombre': return p.nombre;
    case 'apellidoPaterno': return p.apellido_paterno;
    case 'apellidoMaterno': return p.apellido_materno ?? '';
    case 'rfc': return p.rfc;
    case 'correo': return p.correo;
    case 'nacimiento': return formatearFechaSat(p.nacimiento);
    case 'calle': return p.calle;
    case 'numExt': return p.num_ext;
    case 'numInt': return p.num_int ?? '';
    case 'colonia': return p.colonia;
    case 'cp': return p.cp;
    case 'municipio': return p.municipio;
    case 'estado': return p.estado;
  }
}

export type FilaDato = { campo: CampoPerfil; etiqueta: string; valor: string; grupo: GrupoDato };

/** Datos del perfil para los campos pedidos, en ese orden. Se omiten los vacios (p. ej. sin numero interior). */
export function filasDeDatos(perfil: FilaPerfil, campos: readonly CampoPerfil[]): FilaDato[] {
  const filas: FilaDato[] = [];
  for (const campo of campos) {
    const valor = valorDeCampo(perfil, campo).trim();
    if (valor) filas.push({ campo, etiqueta: ETIQUETAS[campo], valor, grupo: GRUPOS[campo] });
  }
  return filas;
}

/**
 * Seguridad: la app SOLO abre direcciones https del SAT (sat.gob.mx o sus subdominios).
 * Evita enlaces mal escritos o disfrazados (sat.gob.mx.otro.com, sat.gob.mx@otro.com...).
 */
export function esEnlaceSatSeguro(url: string): boolean {
  return /^https:\/\/([a-z0-9-]+\.)*sat\.gob\.mx(?:[/?#]|$)/i.test(url);
}

const SIN_ACENTO: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n' };

/** Minusculas y sin acentos, para buscar "declaracion" y encontrar "Declaración". */
export function normalizarBusqueda(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[áéíóúüñ]/g, (c) => SIN_ACENTO[c] ?? c)
    .trim();
}
