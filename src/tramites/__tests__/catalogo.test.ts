import { describe, expect, it } from 'vitest';
import {
  ACCESOS,
  CATEGORIAS,
  TRAMITES,
  VERIFICADO_EN,
  buscarTramite,
  filtrarTramites,
} from '../catalogo';
import { FORMULARIOS } from '../../dinero/formularios';
import { ETIQUETAS, esEnlaceSatSeguro } from '../logica';

describe('integridad del catalogo', () => {
  it('hay varios tramites', () => {
    expect(TRAMITES.length).toBeGreaterThanOrEqual(10);
  });

  it('las declaraciones llevan a la pagina "Declaraciones y pagos personas fisicas" y no solo al inicio del portal', () => {
    for (const id of ['declaracion-anual', 'declaraciones-pagos', 'visores']) {
      const urls = buscarTramite(id)?.enlaces.map((e) => e.url) ?? [];
      expect(urls, id).toContain('https://www.sat.gob.mx/portal/public/tramites/declaraciones-pf');
    }
  });

  it('las rutas de declaraciones usan el nombre actual del portal', () => {
    for (const id of ['declaracion-anual', 'declaraciones-pagos', 'visores']) {
      const ruta = (buscarTramite(id)?.ruta ?? []).join(' ');
      expect(ruta, id).toContain('Declaraciones y pagos personas físicas');
      expect(ruta, id).not.toContain('Declaraciones para personas');
    }
  });

  it('los ids son unicos y con formato simple', () => {
    const ids = TRAMITES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('cada tramite tiene contenido minimo', () => {
    for (const t of TRAMITES) {
      expect(t.titulo.trim(), t.id).not.toBe('');
      expect(t.descripcion.trim(), t.id).not.toBe('');
      expect(t.requisitos.length, `${t.id}: requisitos`).toBeGreaterThan(0);
      expect(t.ruta.length, `${t.id}: ruta`).toBeGreaterThan(0);
      expect(t.acceso.length, `${t.id}: acceso`).toBeGreaterThan(0);
      expect(t.datos.length, `${t.id}: datos`).toBeGreaterThan(0);
      expect(t.enlaces.length, `${t.id}: enlaces`).toBeGreaterThan(0);
    }
  });

  it('SEGURIDAD: todos los enlaces son https del SAT', () => {
    for (const t of TRAMITES) {
      for (const e of t.enlaces) {
        expect(esEnlaceSatSeguro(e.url), `${t.id}: ${e.url}`).toBe(true);
        expect(e.titulo.trim(), `${t.id}: titulo de enlace`).not.toBe('');
      }
    }
  });

  it('categorias, accesos y campos de datos existen', () => {
    const categorias = new Set(CATEGORIAS.map((c) => c.id));
    for (const t of TRAMITES) {
      expect(categorias.has(t.categoria), `${t.id}: categoria`).toBe(true);
      for (const a of t.acceso) expect(ACCESOS[a], `${t.id}: acceso ${a}`).toBeTruthy();
      for (const c of t.datos) expect(ETIQUETAS[c], `${t.id}: dato ${c}`).toBeTruthy();
    }
  });

  it('no repite campos de datos dentro de un tramite', () => {
    for (const t of TRAMITES) expect(new Set(t.datos).size, t.id).toBe(t.datos.length);
  });

  it('los formularios de dinero que referencia un tramite existen', () => {
    for (const t of TRAMITES) {
      for (const d of t.datosDinero ?? []) expect(FORMULARIOS[d], `${t.id}: ${d}`).toBeDefined();
    }
    expect(buscarTramite('declaracion-anual')?.datosDinero).toEqual(['anual', 'cuenta']);
    expect(buscarTramite('declaraciones-pagos')?.datosDinero).toEqual(['mensual']);
  });

  it('toda categoria tiene al menos un tramite', () => {
    for (const c of CATEGORIAS) expect(TRAMITES.some((t) => t.categoria === c.id), c.id).toBe(true);
  });

  it('indica la fecha de revision', () => {
    expect(VERIFICADO_EN).toMatch(/\d{4}$/);
  });

  it('ninguna nota ni requisito pide la contrasena o la e.firma "a la app"', () => {
    const texto = TRAMITES.flatMap((t) => [...t.requisitos, t.notas ?? '']).join(' ').toLowerCase();
    expect(texto).not.toContain('envía tu contraseña');
    expect(texto).not.toContain('comparte tu contraseña');
  });
});

describe('buscarTramite', () => {
  it('encuentra por id', () => {
    expect(buscarTramite('efirma')?.titulo).toContain('e.firma');
  });
  it('devuelve undefined si no existe', () => {
    expect(buscarTramite('no-existe')).toBeUndefined();
    expect(buscarTramite('')).toBeUndefined();
  });
});

describe('filtrarTramites', () => {
  it('sin filtros devuelve todos', () => {
    expect(filtrarTramites(TRAMITES, '', 'todas')).toHaveLength(TRAMITES.length);
    expect(filtrarTramites(TRAMITES, '   ', 'todas')).toHaveLength(TRAMITES.length);
  });

  it('filtra por categoria', () => {
    const r = filtrarTramites(TRAMITES, '', 'firma');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((t) => t.categoria === 'firma')).toBe(true);
  });

  it('busca sin importar acentos ni mayusculas', () => {
    expect(filtrarTramites(TRAMITES, 'DECLARACION', 'todas').map((t) => t.id)).toContain('declaracion-anual');
    expect(filtrarTramites(TRAMITES, 'contraseña', 'todas').map((t) => t.id)).toContain('contrasena-sat');
    expect(filtrarTramites(TRAMITES, 'contrasena', 'todas').map((t) => t.id)).toContain('contrasena-sat');
  });

  it('busca en las etiquetas (32-d, csf)', () => {
    expect(filtrarTramites(TRAMITES, '32-d', 'todas').map((t) => t.id)).toContain('opinion-cumplimiento');
    expect(filtrarTramites(TRAMITES, 'csf', 'todas').map((t) => t.id)).toContain('constancia-situacion-fiscal');
  });

  it('varias palabras deben aparecer todas (sin importar el orden)', () => {
    const r = filtrarTramites(TRAMITES, 'anual declaracion', 'todas').map((t) => t.id);
    expect(r).toContain('declaracion-anual');
    expect(filtrarTramites(TRAMITES, 'anual jirafa', 'todas')).toEqual([]);
  });

  it('combina texto y categoria', () => {
    expect(filtrarTramites(TRAMITES, 'cita', 'declaraciones')).toEqual([]);
    expect(filtrarTramites(TRAMITES, 'cita', 'atencion').map((t) => t.id)).toContain('cita-sat');
  });

  it('sin resultados devuelve lista vacia', () => {
    expect(filtrarTramites(TRAMITES, 'zzzz', 'todas')).toEqual([]);
  });
});
