/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SECCIONES } from '../secciones';

const carpetaApp = join(process.cwd(), 'app', '(app)');

describe('SECCIONES', () => {
  it('incluye las secciones del dashboard, en orden', () => {
    expect(SECCIONES.map((s) => s.id)).toEqual(['tramites', 'documentos', 'calendario', 'guias', 'perfil']);
  });

  it('tiene ids y rutas unicos', () => {
    expect(new Set(SECCIONES.map((s) => s.id)).size).toBe(SECCIONES.length);
    expect(new Set(SECCIONES.map((s) => s.ruta)).size).toBe(SECCIONES.length);
  });

  it('cada ruta es "/" + id', () => {
    for (const s of SECCIONES) expect(s.ruta).toBe(`/${s.id}`);
  });

  it('todas tienen titulo, descripcion e icono', () => {
    for (const s of SECCIONES) {
      expect(s.titulo.trim()).not.toBe('');
      expect(s.descripcion.trim()).not.toBe('');
      expect(s.icono).toBeTruthy();
    }
  });

  it('solo Tramites (arriba) ocupa todo el ancho; las otras cuatro van en dos columnas', () => {
    expect(SECCIONES.filter((s) => s.anchoCompleto).map((s) => s.id)).toEqual(['tramites']);
  });

  it('ya no existe la pantalla de Configuracion (contraseña y sesion viven en Mi perfil)', () => {
    expect(existsSync(join(carpetaApp, 'configuracion.tsx'))).toBe(false);
    expect(SECCIONES.some((s) => s.id === ('configuracion' as string))).toBe(false);
    expect(readFileSync(join(carpetaApp, '_layout.tsx'), 'utf-8')).not.toContain('configuracion');
  });

  it('las pantallas de Mi perfil (domicilio y contraseña) estan declaradas en el layout', () => {
    const layout = readFileSync(join(carpetaApp, '_layout.tsx'), 'utf-8');
    for (const nombre of ['perfil-domicilio', 'perfil-password']) {
      expect(existsSync(join(carpetaApp, `${nombre}.tsx`)), `falta ${nombre}.tsx`).toBe(true);
      expect(layout, `falta Stack.Screen ${nombre}`).toContain(`name="${nombre}"`);
    }
  });

  it('cada seccion tiene su pantalla en app/(app)/ (evita "Unmatched Route")', () => {
    for (const s of SECCIONES) {
      expect(existsSync(join(carpetaApp, `${s.id}.tsx`)), `falta app/(app)/${s.id}.tsx`).toBe(true);
    }
  });

  it('cada seccion esta declarada en el layout con su titulo', () => {
    const layout = readFileSync(join(carpetaApp, '_layout.tsx'), 'utf-8');
    for (const s of SECCIONES) {
      expect(layout, `falta Stack.Screen "${s.id}" en _layout.tsx`).toContain(`name="${s.id}"`);
      expect(layout, `titulo de ${s.id}`).toContain(`title: '${s.titulo}'`);
    }
  });
});
