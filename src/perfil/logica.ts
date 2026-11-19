/** Logica pura de "Mi perfil" (sin dependencias de la app: facil de probar). */

import type { DomicilioData, DomicilioFormValues } from '../validation/perfil';
import type { FilaPerfil } from '../tramites/logica';

/** Columnas de la tabla usuario que el servidor deja editar (ver supabase/003_perfil_solo_domicilio.sql). */
export type DomicilioActualizacion = {
  calle: string;
  num_ext: string;
  num_int: string | null;
  colonia: string;
  cp: string;
  municipio: string;
  estado: string;
};

/** Hasta dos letras para el avatar: inicial del nombre y del apellido paterno. */
export function iniciales(nombre: string, apellidoPaterno: string): string {
  const primera = (t: string) => t.trim().charAt(0).toLocaleUpperCase('es-MX');
  const letras = `${primera(nombre)}${primera(apellidoPaterno)}`;
  return letras || '?';
}

export function nombreCompleto(p: Pick<FilaPerfil, 'nombre' | 'apellido_paterno' | 'apellido_materno'>): string {
  return [p.nombre, p.apellido_paterno, p.apellido_materno ?? ''].map((t) => t.trim()).filter(Boolean).join(' ');
}

/** Valores iniciales del formulario de domicilio a partir del perfil guardado. */
export function domicilioDeFila(p: FilaPerfil): DomicilioFormValues {
  return {
    calle: p.calle,
    numExt: p.num_ext,
    numInt: p.num_int ?? '',
    colonia: p.colonia,
    cp: p.cp,
    municipio: p.municipio,
    estado: p.estado,
  };
}

/** Lo que se envia al servidor: nombres de columna de la base de datos; sin numero interior = null. */
export function actualizacionDeDomicilio(d: DomicilioData): DomicilioActualizacion {
  return {
    calle: d.calle,
    num_ext: d.numExt,
    num_int: d.numInt === '' ? null : d.numInt,
    colonia: d.colonia,
    cp: d.cp,
    municipio: d.municipio,
    estado: d.estado,
  };
}

/** true si el domicilio escrito es igual al que ya esta guardado (no hace falta enviar nada). */
export function domicilioSinCambios(p: FilaPerfil, d: DomicilioData): boolean {
  const nuevo = actualizacionDeDomicilio(d);
  return (
    nuevo.calle === p.calle &&
    nuevo.num_ext === p.num_ext &&
    nuevo.num_int === (p.num_int === '' ? null : p.num_int) &&
    nuevo.colonia === p.colonia &&
    nuevo.cp === p.cp &&
    nuevo.municipio === p.municipio &&
    nuevo.estado === p.estado
  );
}
