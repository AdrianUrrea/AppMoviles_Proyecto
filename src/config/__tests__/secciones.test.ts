/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SECCIONES } from '../secciones';

const carpetaApp = join(process.cwd(), 'app', '(app)');

describe('SECCIONES', () => {
  it('incluye las secciones del dashboard, en orden', () => {
    expect(SECCIONES.map((s) => s.id)).toEqual(['tramites', 'documentos', 'calendario', 'guias', 'perfil', 'configuracion']);
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

  it('solo Tramites (arriba) y Configuracion (abajo) ocupan todo el ancho', () => {
    expect(SECCIONES.filter((s) => s.anchoCompleto).map((s) => s.id)).toEqual(['tramites', 'configuracion']);
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
