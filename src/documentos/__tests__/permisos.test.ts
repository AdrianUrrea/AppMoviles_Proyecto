import { describe, expect, it, vi } from 'vitest';
import { asegurarPermiso } from '../permisos';
import type { EstadoPermiso } from '../permisos';

const concedido: EstadoPermiso = { granted: true, canAskAgain: true };
const sinPreguntar: EstadoPermiso = { granted: false, canAskAgain: false };
const puedePreguntar: EstadoPermiso = { granted: false, canAskAgain: true };

function probar(actual: EstadoPermiso, trasPedir: EstadoPermiso) {
  const obtener = vi.fn(async () => actual);
  const pedir = vi.fn(async () => trasPedir);
  return { obtener, pedir, resultado: asegurarPermiso(obtener, pedir) };
}

describe('asegurarPermiso', () => {
  it('ya concedido: no vuelve a pedir', async () => {
    const t = probar(concedido, concedido);
    expect(await t.resultado).toEqual({ concedido: true });
    expect(t.pedir).not.toHaveBeenCalled();
  });

  it('pendiente (nunca se ha pedido): lo pide y, si lo conceden, sigue', async () => {
    const t = probar(puedePreguntar, concedido);
    expect(await t.resultado).toEqual({ concedido: true });
    expect(t.pedir).toHaveBeenCalledTimes(1);
  });

  it('REGRESION: "Preguntar siempre" en Android llega como canAskAgain=false y AUN ASI se pide el permiso', async () => {
    const t = probar(sinPreguntar, concedido);
    expect(await t.resultado).toEqual({ concedido: true });
    expect(t.pedir).toHaveBeenCalledTimes(1); // antes se mandaba directo a Ajustes sin pedirlo
  });

  it('bloqueado de verdad: el sistema responde denegado al instante y se manda a Ajustes', async () => {
    const t = probar(sinPreguntar, sinPreguntar);
    expect(await t.resultado).toEqual({ concedido: false, puedePreguntar: false });
    expect(t.pedir).toHaveBeenCalledTimes(1);
  });

  it('el usuario lo nego esta vez pero el sistema permite preguntar otra vez', async () => {
    const t = probar(puedePreguntar, puedePreguntar);
    expect(await t.resultado).toEqual({ concedido: false, puedePreguntar: true });
  });

  it('un fallo del sistema no se traga: lo recibe quien llama', async () => {
    await expect(
      asegurarPermiso(
        async () => {
          throw new Error('sin modulo');
        },
        async () => concedido,
      ),
    ).rejects.toThrow('sin modulo');
  });

  it('un fallo al pedir tampoco se traga', async () => {
    await expect(
      asegurarPermiso(
        async () => puedePreguntar,
        async () => {
          throw new Error('se cerro el cuadro');
        },
      ),
    ).rejects.toThrow('se cerro el cuadro');
  });
});
