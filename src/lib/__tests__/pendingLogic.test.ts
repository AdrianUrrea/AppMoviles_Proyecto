import { describe, expect, it } from 'vitest';
import { VIGENCIA_PENDIENTE_MS, leerPendiente, serializarPendiente } from '../pendingLogic';

const ahora = 1_800_000_000_000;

describe('leerPendiente', () => {
  it('recupera el correo guardado', () => {
    expect(leerPendiente(serializarPendiente('ana@correo.com', ahora), ahora + 5_000)).toBe('ana@correo.com');
  });

  it('sigue vigente justo a las 24 h y vence despues', () => {
    const raw = serializarPendiente('ana@correo.com', ahora);
    expect(leerPendiente(raw, ahora + VIGENCIA_PENDIENTE_MS)).toBe('ana@correo.com');
    expect(leerPendiente(raw, ahora + VIGENCIA_PENDIENTE_MS + 1)).toBeNull();
  });

  it('descarta fechas en el futuro (reloj del telefono cambiado)', () => {
    expect(leerPendiente(serializarPendiente('ana@correo.com', ahora + 60_000), ahora)).toBeNull();
  });

  it('devuelve null si no hay nada guardado', () => {
    expect(leerPendiente(null, ahora)).toBeNull();
    expect(leerPendiente('', ahora)).toBeNull();
  });

  it('devuelve null con datos corruptos o de tipo incorrecto', () => {
    expect(leerPendiente('no es json', ahora)).toBeNull();
    expect(leerPendiente('{}', ahora)).toBeNull();
    expect(leerPendiente(JSON.stringify({ correo: 5, at: ahora }), ahora)).toBeNull();
    expect(leerPendiente(JSON.stringify({ correo: 'a@b.co', at: 'hoy' }), ahora)).toBeNull();
    expect(leerPendiente(JSON.stringify({ correo: '', at: ahora }), ahora)).toBeNull();
    expect(leerPendiente('null', ahora)).toBeNull();
  });
});
