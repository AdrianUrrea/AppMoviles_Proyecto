import { describe, expect, it } from 'vitest';
import {
  esEnlaceSatSeguro,
  filasDeDatos,
  formatearFechaSat,
  normalizarBusqueda,
  valorDeCampo,
} from '../logica';
import type { FilaPerfil } from '../logica';

const perfil: FilaPerfil = {
  nombre: 'Eduardo',
  apellido_paterno: 'Gómez',
  apellido_materno: 'Díaz',
  correo: 'ana@correo.com',
  rfc: 'GODE561231GR8',
  nacimiento: '1956-12-31',
  calle: 'Av. Reforma',
  num_ext: '120',
  num_int: null,
  colonia: 'Centro',
  cp: '22800',
  municipio: 'Ensenada',
  estado: 'Baja California',
};

describe('esEnlaceSatSeguro', () => {
  it('acepta https del SAT y sus subdominios', () => {
    for (const u of [
      'https://www.sat.gob.mx/',
      'https://sat.gob.mx',
      'https://citas.sat.gob.mx/',
      'https://satid.sat.gob.mx/',
      'https://wwwmat.sat.gob.mx/aplicacion/43824/reimprime-tus-acuses-del-rfc',
      'https://www.sat.gob.mx/gobmx/Paginas/ficha_1_cff.html',
      'https://HTTPS-no.sat.gob.mx?x=1',
    ]) {
      expect(esEnlaceSatSeguro(u), u).toBe(true);
    }
  });

  it('rechaza http, dominios parecidos y trucos con @ o subdominios', () => {
    for (const u of [
      'http://www.sat.gob.mx/',
      'https://sat.gob.mx.evil.com/',
      'https://sat.gob.mx@evil.com/',
      'https://evilsat.gob.mx/',
      'https://www.sat.gob.mx.mx.evil.com',
      'https://sat-gob.mx/',
      'https://evil.com/?https://www.sat.gob.mx/',
      'javascript:alert(1)',
      'ftp://sat.gob.mx/',
      'sat.gob.mx',
      '',
    ]) {
      expect(esEnlaceSatSeguro(u), u).toBe(false);
    }
  });
});

describe('formatearFechaSat', () => {
  it('convierte a DD/MM/AAAA', () => {
    expect(formatearFechaSat('1956-12-31')).toBe('31/12/1956');
    expect(formatearFechaSat('2000-02-29')).toBe('29/02/2000');
  });
  it('si no es una fecha ISO la deja igual', () => {
    expect(formatearFechaSat('hoy')).toBe('hoy');
    expect(formatearFechaSat('')).toBe('');
  });
});

describe('valorDeCampo y filasDeDatos', () => {
  it('lee cada campo del perfil', () => {
    expect(valorDeCampo(perfil, 'apellidoPaterno')).toBe('Gómez');
    expect(valorDeCampo(perfil, 'nacimiento')).toBe('31/12/1956');
    expect(valorDeCampo(perfil, 'numInt')).toBe('');
  });

  it('respeta el orden pedido y agrega etiqueta y grupo', () => {
    const filas = filasDeDatos(perfil, ['rfc', 'nombre', 'cp']);
    expect(filas.map((f) => f.campo)).toEqual(['rfc', 'nombre', 'cp']);
    expect(filas[0]).toMatchObject({ etiqueta: 'RFC', valor: 'GODE561231GR8', grupo: 'identidad' });
    expect(filas[2]).toMatchObject({ etiqueta: 'Código postal', grupo: 'domicilio' });
  });

  it('omite campos vacios (sin numero interior) y los que solo tienen espacios', () => {
    const campos = ['calle', 'numExt', 'numInt'] as const;
    expect(filasDeDatos(perfil, campos).map((f) => f.campo)).toEqual(['calle', 'numExt']);
    expect(filasDeDatos({ ...perfil, apellido_materno: '   ' }, ['apellidoMaterno'])).toEqual([]);
  });

  it('con una lista vacia no devuelve nada', () => {
    expect(filasDeDatos(perfil, [])).toEqual([]);
  });
});

describe('normalizarBusqueda', () => {
  it('quita acentos y mayusculas', () => {
    expect(normalizarBusqueda('  Declaración ANUAL ')).toBe('declaracion anual');
    expect(normalizarBusqueda('Contraseña')).toBe('contrasena');
    expect(normalizarBusqueda('Pingüino Ñandú')).toBe('pinguino nandu');
  });
});
