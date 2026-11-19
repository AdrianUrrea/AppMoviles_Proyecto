import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS_GUIA,
  GUIAS,
  buscarGuia,
  filtrarGuias,
  guiasDeTramite,
} from '../catalogo';
import { TRAMITES } from '../../tramites/catalogo';

describe('integridad del catalogo de guias', () => {
  it('hay varias guias', () => {
    expect(GUIAS.length).toBeGreaterThanOrEqual(15);
  });

  it('los ids son unicos y con formato simple', () => {
    const ids = GUIAS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('cada guia tiene contenido minimo', () => {
    for (const g of GUIAS) {
      expect(g.titulo.trim(), g.id).not.toBe('');
      expect(g.resumen.trim(), `${g.id}: resumen`).not.toBe('');
      expect(g.queEs.length, `${g.id}: queEs`).toBeGreaterThan(0);
      expect(g.paraQue.length, `${g.id}: paraQue`).toBeGreaterThan(0);
      for (const t of [...g.queEs, ...g.paraQue, ...(g.dondeLoEncuentras ?? [])]) {
        expect(t.trim(), `${g.id}: texto vacio`).not.toBe('');
      }
    }
  });

  it('el resumen cabe en una linea corta de lista (sin parrafos largos)', () => {
    for (const g of GUIAS) expect(g.resumen.length, `${g.id}: resumen largo`).toBeLessThanOrEqual(90);
  });

  it('las categorias existen y todas tienen al menos una guia', () => {
    const categorias = new Set(CATEGORIAS_GUIA.map((c) => c.id));
    for (const g of GUIAS) expect(categorias.has(g.categoria), `${g.id}: categoria`).toBe(true);
    for (const c of CATEGORIAS_GUIA) expect(GUIAS.some((g) => g.categoria === c.id), c.id).toBe(true);
  });

  it('no repite texto dentro de una misma lista (se usa como key en la pantalla)', () => {
    for (const g of GUIAS) {
      expect(new Set(g.queEs).size, `${g.id}: queEs`).toBe(g.queEs.length);
      expect(new Set(g.paraQue).size, `${g.id}: paraQue`).toBe(g.paraQue.length);
      expect(new Set(g.dondeLoEncuentras ?? []).size, `${g.id}: dondeLoEncuentras`).toBe(g.dondeLoEncuentras?.length ?? 0);
    }
  });

  it('las guias relacionadas existen, no se repiten y no se apuntan a si mismas', () => {
    for (const g of GUIAS) {
      expect(new Set(g.relacionadas).size, `${g.id}: repetidas`).toBe(g.relacionadas.length);
      for (const r of g.relacionadas) {
        expect(r, `${g.id} se relaciona consigo misma`).not.toBe(g.id);
        expect(buscarGuia(r), `${g.id}: la guia relacionada "${r}" no existe`).toBeDefined();
      }
    }
  });

  it('los tramites que menciona una guia existen en el catalogo de tramites', () => {
    const ids = new Set(TRAMITES.map((t) => t.id));
    for (const g of GUIAS) {
      expect(new Set(g.tramites).size, `${g.id}: tramites repetidos`).toBe(g.tramites.length);
      for (const t of g.tramites) expect(ids.has(t), `${g.id}: el tramite "${t}" no existe`).toBe(true);
    }
  });

  it('SEGURIDAD: ninguna guia pide compartir contrasena, e.firma ni codigos', () => {
    const texto = GUIAS.flatMap((g) => [
      ...g.queEs,
      ...g.paraQue,
      ...(g.dondeLoEncuentras ?? []),
      g.ejemplo ?? '',
      g.ojo ?? '',
    ])
      .join(' ')
      .toLowerCase();
    expect(texto).not.toContain('comparte tu contraseña');
    expect(texto).not.toContain('envía tu contraseña');
    expect(texto).not.toContain('manda tu contraseña');
    expect(texto).not.toContain('dame tu e.firma');
  });

  it('las guias de acceso advierten que son personales', () => {
    expect(buscarGuia('contrasena')?.ojo ?? '').toMatch(/personal/i);
    expect(buscarGuia('efirma')?.ojo ?? '').toMatch(/no los compartas|no la compartas/i);
  });

  it('el ejemplo de RFC es inventado y lo dice', () => {
    expect(buscarGuia('rfc')?.ejemplo ?? '').toMatch(/inventado/i);
  });
});

describe('buscarGuia', () => {
  it('encuentra por id', () => {
    expect(buscarGuia('rfc')?.titulo).toBe('RFC');
  });
  it('devuelve undefined si no existe', () => {
    expect(buscarGuia('no-existe')).toBeUndefined();
    expect(buscarGuia('')).toBeUndefined();
  });
});

describe('guiasDeTramite', () => {
  it('devuelve las guias que mencionan el tramite', () => {
    const ids = guiasDeTramite('declaracion-anual').map((g) => g.id);
    expect(ids).toEqual(expect.arrayContaining(['declaracion-anual', 'deducciones', 'clabe', 'efirma']));
  });

  it('devuelve vacio si el tramite no tiene guias', () => {
    expect(guiasDeTramite('no-existe')).toEqual([]);
  });

  it('cada tramite del catalogo tiene al menos una guia que lo explique', () => {
    for (const t of TRAMITES) expect(guiasDeTramite(t.id).length, `sin guias: ${t.id}`).toBeGreaterThan(0);
  });
});

describe('filtrarGuias', () => {
  it('sin filtros devuelve todas', () => {
    expect(filtrarGuias(GUIAS, '', 'todas')).toHaveLength(GUIAS.length);
    expect(filtrarGuias(GUIAS, '   ', 'todas')).toHaveLength(GUIAS.length);
  });

  it('filtra por categoria', () => {
    const r = filtrarGuias(GUIAS, '', 'acceso');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((g) => g.categoria === 'acceso')).toBe(true);
  });

  it('busca sin importar acentos ni mayusculas', () => {
    expect(filtrarGuias(GUIAS, 'CONTRASEÑA', 'todas').map((g) => g.id)).toContain('contrasena');
    expect(filtrarGuias(GUIAS, 'contrasena', 'todas').map((g) => g.id)).toContain('contrasena');
    expect(filtrarGuias(GUIAS, 'regimen', 'todas').map((g) => g.id)).toContain('regimen-fiscal');
  });

  it('encuentra por otros nombres (etiquetas): ciec, fiel, factura, csf', () => {
    expect(filtrarGuias(GUIAS, 'ciec', 'todas').map((g) => g.id)).toContain('contrasena');
    expect(filtrarGuias(GUIAS, 'fiel', 'todas').map((g) => g.id)).toContain('efirma');
    expect(filtrarGuias(GUIAS, 'factura', 'todas').map((g) => g.id)).toContain('cfdi');
    expect(filtrarGuias(GUIAS, 'csf', 'todas').map((g) => g.id)).toContain('constancia-situacion-fiscal');
  });

  it('varias palabras deben aparecer todas (sin importar el orden)', () => {
    expect(filtrarGuias(GUIAS, 'fiscal regimen', 'todas').map((g) => g.id)).toContain('regimen-fiscal');
    expect(filtrarGuias(GUIAS, 'rfc jirafa', 'todas')).toEqual([]);
  });

  it('combina texto y categoria', () => {
    expect(filtrarGuias(GUIAS, 'rfc', 'acceso').map((g) => g.id)).not.toContain('homoclave');
    expect(filtrarGuias(GUIAS, 'homoclave', 'basicos').map((g) => g.id)).toContain('homoclave');
  });

  it('sin resultados devuelve lista vacia', () => {
    expect(filtrarGuias(GUIAS, 'zzzz', 'todas')).toEqual([]);
  });
});
