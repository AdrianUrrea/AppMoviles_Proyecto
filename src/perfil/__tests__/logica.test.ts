import { describe, expect, it } from 'vitest';
import { domicilioSchema } from '../../validation/perfil';
import { registroSchema } from '../../validation/registro';
import type { FilaPerfil } from '../../tramites/logica';
import { actualizacionDeDomicilio, domicilioDeFila, domicilioSinCambios, iniciales, nombreCompleto } from '../logica';

const perfil: FilaPerfil = {
  nombre: 'María Fernanda',
  apellido_paterno: 'López',
  apellido_materno: 'Ruiz',
  correo: 'maria@correo.com',
  rfc: 'LORM900101AB1',
  nacimiento: '1990-01-01',
  calle: 'Av. Reforma',
  num_ext: '120',
  num_int: '4B',
  colonia: 'Centro',
  cp: '22800',
  municipio: 'Ensenada',
  estado: 'Baja California',
};

const valido = (extra: Record<string, string> = {}) =>
  domicilioSchema.parse({ ...domicilioDeFila(perfil), ...extra });

describe('iniciales y nombre', () => {
  it('toma la inicial del nombre y del apellido paterno (con acentos y minusculas)', () => {
    expect(iniciales('maría', 'lópez')).toBe('ML');
    expect(iniciales('Álvaro', 'Ñandú')).toBe('ÁÑ');
  });
  it('no truena con textos vacios', () => {
    expect(iniciales('', '')).toBe('?');
    expect(iniciales('  ', 'Pérez')).toBe('P');
  });
  it('nombre completo sin espacios de mas y sin apellido materno', () => {
    expect(nombreCompleto(perfil)).toBe('María Fernanda López Ruiz');
    expect(nombreCompleto({ ...perfil, apellido_materno: null })).toBe('María Fernanda López');
    expect(nombreCompleto({ ...perfil, nombre: ' Ana ', apellido_materno: '' })).toBe('Ana López');
  });
});

describe('domicilio: de la base de datos al formulario y de regreso', () => {
  it('numero interior vacio en la base de datos -> campo vacio en el formulario', () => {
    expect(domicilioDeFila({ ...perfil, num_int: null }).numInt).toBe('');
  });
  it('ida y vuelta: lo que se carga se puede enviar tal cual', () => {
    expect(actualizacionDeDomicilio(valido())).toEqual({
      calle: 'Av. Reforma',
      num_ext: '120',
      num_int: '4B',
      colonia: 'Centro',
      cp: '22800',
      municipio: 'Ensenada',
      estado: 'Baja California',
    });
  });
  it('sin numero interior se envia null (no una cadena vacia)', () => {
    expect(actualizacionDeDomicilio(valido({ numInt: '   ' })).num_int).toBeNull();
  });
  it('solo envia columnas que el servidor deja editar (nunca nombre, rfc, correo, nacimiento ni rol)', () => {
    expect(Object.keys(actualizacionDeDomicilio(valido())).sort()).toEqual(
      ['calle', 'colonia', 'cp', 'estado', 'municipio', 'num_ext', 'num_int'],
    );
  });
});

describe('domicilioSinCambios', () => {
  it('igual al guardado (aunque se haya escrito con espacios)', () => {
    expect(domicilioSinCambios(perfil, valido({ calle: '  Av. Reforma  ' }))).toBe(true);
  });
  it('detecta cualquier campo distinto, incluido quitar el numero interior', () => {
    expect(domicilioSinCambios(perfil, valido({ colonia: 'Zona Centro' }))).toBe(false);
    expect(domicilioSinCambios(perfil, valido({ numInt: '' }))).toBe(false);
  });
  it('sin interior en ambos lados cuenta como igual', () => {
    expect(domicilioSinCambios({ ...perfil, num_int: null }, valido({ numInt: '' }))).toBe(true);
  });
});

describe('validacion del domicilio (mismas reglas que el registro)', () => {
  it('rechaza campos obligatorios vacios y codigo postal mal escrito', () => {
    for (const campo of ['calle', 'numExt', 'colonia', 'cp', 'municipio', 'estado']) {
      expect(domicilioSchema.safeParse({ ...domicilioDeFila(perfil), [campo]: '  ' }).success, campo).toBe(false);
    }
    expect(domicilioSchema.safeParse({ ...domicilioDeFila(perfil), cp: '2280' }).success).toBe(false);
    expect(domicilioSchema.safeParse({ ...domicilioDeFila(perfil), cp: '22A00' }).success).toBe(false);
  });
  it('el numero interior es opcional', () => {
    expect(domicilioSchema.safeParse({ ...domicilioDeFila(perfil), numInt: '' }).success).toBe(true);
  });
  it('el registro sigue usando exactamente los mismos campos de domicilio', () => {
    const claves = Object.keys(registroSchema.def.shape);
    for (const c of ['calle', 'numExt', 'numInt', 'colonia', 'cp', 'municipio', 'estado']) expect(claves).toContain(c);
  });
});
