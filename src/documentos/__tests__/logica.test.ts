import { describe, expect, it } from 'vitest';
import { MSG } from '../../validation/mensajes';
import { documentoNuevoSchema } from '../esquema';
import {
  LADO_MAXIMO_PX,
  construirRuta,
  dimensionesObjetivo,
  filaADocumento,
  formatearFechaCorta,
  formatearTamano,
  nombreSugerido,
  resumenDeDocumentos,
  normalizarUriLocal,
} from '../logica';

describe('dimensionesObjetivo', () => {
  it('reduce por el lado mas largo en fotos horizontales y verticales', () => {
    expect(dimensionesObjetivo(4000, 3000)).toEqual({ width: LADO_MAXIMO_PX });
    expect(dimensionesObjetivo(3000, 4000)).toEqual({ height: LADO_MAXIMO_PX });
  });
  it('fotos cuadradas se reducen por el ancho', () => {
    expect(dimensionesObjetivo(3000, 3000)).toEqual({ width: LADO_MAXIMO_PX });
  });
  it('nunca agranda: imagenes pequenas o justo del limite no se tocan', () => {
    expect(dimensionesObjetivo(800, 600)).toBeNull();
    expect(dimensionesObjetivo(1600, 1200)).toBeNull();
    expect(dimensionesObjetivo(1200, 1600)).toBeNull();
    expect(dimensionesObjetivo(1601, 1000)).toEqual({ width: LADO_MAXIMO_PX });
  });
  it('dimensiones invalidas o desconocidas no producen un ajuste', () => {
    for (const [a, b] of [[0, 0], [0, 3000], [-5, 100], [NaN, 100], [Infinity, 100]]) {
      expect(dimensionesObjetivo(a, b), `${a}x${b}`).toBeNull();
    }
  });
  it('acepta un maximo personalizado', () => {
    expect(dimensionesObjetivo(1000, 500, 800)).toEqual({ width: 800 });
  });
});

describe('construirRuta', () => {
  const user = '3f2b8c1e-aaaa-bbbb-cccc-1234567890ab';
  const uuid = '9d8e7f6a-1111-2222-3333-abcdefabcdef';
  it('queda dentro de la carpeta del usuario con extension jpg', () => {
    const ruta = construirRuta(user, uuid);
    expect(ruta).toBe(`${user}/${uuid}.jpg`);
    expect(ruta.startsWith(`${user}/`)).toBe(true);
  });
  it('tiene exactamente un nivel de carpeta (la politica de storage mira la primera)', () => {
    expect(construirRuta(user, uuid).split('/')).toHaveLength(2);
  });
});

describe('formatos', () => {
  it('fecha corta en espanol', () => {
    expect(formatearFechaCorta(new Date(2026, 9, 24))).toBe('24 oct 2026');
    expect(formatearFechaCorta(new Date(2027, 0, 1))).toBe('1 ene 2027');
  });
  it('nombre sugerido', () => {
    expect(nombreSugerido(new Date(2026, 9, 24, 15, 0))).toBe('Documento 24 oct 2026');
  });
  it('tamano legible', () => {
    expect(formatearTamano(0)).toBe('0 B');
    expect(formatearTamano(1023)).toBe('1023 B');
    expect(formatearTamano(1024)).toBe('1 KB');
    expect(formatearTamano(350 * 1024)).toBe('350 KB');
    expect(formatearTamano(1.5 * 1024 * 1024)).toBe('1.5 MB');
    expect(formatearTamano(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('filaADocumento', () => {
  it('convierte la fila de la base de datos', () => {
    const d = filaADocumento({
      id_documento: 'd1',
      nombre: 'INE',
      ruta_archivo: 'u/d1.jpg',
      tamano_bytes: 2048,
      created_at: '2026-10-24T18:00:00.000Z',
    });
    expect(d).toMatchObject({ id: 'd1', nombre: 'INE', ruta: 'u/d1.jpg', tamano: 2048 });
    expect(d.creadoEn.toISOString()).toBe('2026-10-24T18:00:00.000Z');
  });
});

describe('documentoNuevoSchema', () => {
  const errorDe = (nombre: string) => {
    const r = documentoNuevoSchema.safeParse({ nombre });
    return r.success ? null : r.error.issues[0].message;
  };
  it('exige nombre; solo espacios cuenta como vacio', () => {
    expect(errorDe('')).toBe(MSG.documento.nombre.obligatorio);
    expect(errorDe('    ')).toBe(MSG.documento.nombre.obligatorio);
  });
  it('limita a 80 caracteres', () => {
    expect(errorDe('a'.repeat(80))).toBeNull();
    expect(errorDe('a'.repeat(81))).toBe(MSG.documento.nombre.muyLargo);
  });
  it('acepta acentos, numeros y simbolos, y recorta espacios', () => {
    expect(errorDe('Acta de nacimiento (copia) #2 - 2026')).toBeNull();
    const r = documentoNuevoSchema.safeParse({ nombre: '  INE frente  ' });
    expect(r.success && r.data.nombre).toBe('INE frente');
  });
});

describe('normalizarUriLocal (rutas de Expo Go en Android)', () => {
  // La ruta REAL que dio el error ENOENT al tomar una foto.
  const real =
    'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%40anonymous%2FProyecto-58de8507-2839-4220-8df9-92dae2a797d4/ImagePicker/e9d309eb-e3dd-407f-a1c0-20f091a2868a.jpeg';

  /** Lo que hace Android al abrir un archivo: decodifica la ruta de la URI. */
  const comoLoAbreAndroid = (uri: string) => decodeURIComponent(uri.replace('file://', ''));

  it('SIN corregir, Android buscaria una carpeta inexistente (reproduce el error)', () => {
    expect(comoLoAbreAndroid(real)).toContain('ExperienceData/@anonymous/Proyecto-');
  });

  it('corregida, Android decodifica el nombre REAL de la carpeta', () => {
    const arreglada = normalizarUriLocal(real);
    expect(comoLoAbreAndroid(arreglada)).toBe(
      '/data/user/0/host.exp.exponent/cache/ExperienceData/%40anonymous%2FProyecto-58de8507-2839-4220-8df9-92dae2a797d4/ImagePicker/e9d309eb-e3dd-407f-a1c0-20f091a2868a.jpeg',
    );
  });

  it('es idempotente: aplicarla dos veces no la daña', () => {
    const una = normalizarUriLocal(real);
    expect(normalizarUriLocal(una)).toBe(una);
  });

  it('no toca rutas de una app instalada, ni content://, ni URLs con espacios codificados', () => {
    for (const u of [
      'file:///data/user/0/com.miapp/cache/ImagePicker/abc.jpeg',
      'file:///data/user/0/com.miapp/cache/Mis%20Fotos/abc.jpeg',
      'content://media/external/images/media/1234',
      'file:///var/mobile/Containers/Data/Application/AAAA/Library/Caches/ImagePicker/abc.jpg',
    ]) {
      expect(normalizarUriLocal(u), u).toBe(u);
    }
  });
});

describe('resumenDeDocumentos', () => {
  it('sin documentos', () => {
    expect(resumenDeDocumentos(0, false)).toBe('Aún no tienes documentos guardados');
    expect(resumenDeDocumentos(0, true)).toBe('Aún no tienes documentos guardados');
  });
  it('con uno o varios, en singular y plural', () => {
    expect(resumenDeDocumentos(1, false)).toBe('1 documento guardado · toca para verlo');
    expect(resumenDeDocumentos(3, false)).toBe('3 documentos guardados · toca para verlos');
  });
  it('abierta, invita a ocultar', () => {
    expect(resumenDeDocumentos(2, true)).toBe('2 documentos guardados · toca para ocultar');
  });
});
