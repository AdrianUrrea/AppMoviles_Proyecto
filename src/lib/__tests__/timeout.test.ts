import { afterEach, describe, expect, it, vi } from 'vitest';
import { withTimeout } from '../timeout';

afterEach(() => vi.useRealTimers());

describe('withTimeout', () => {
  it('devuelve el resultado si llega a tiempo', async () => {
    await expect(withTimeout(Promise.resolve(5), 1000, () => new Error('tiempo'))).resolves.toBe(5);
  });

  it('propaga el error original si la promesa falla antes del limite', async () => {
    await expect(withTimeout(Promise.reject(new Error('original')), 1000, () => new Error('tiempo'))).rejects.toThrow(
      'original',
    );
  });

  it('rechaza con el error indicado si tarda demasiado', async () => {
    vi.useFakeTimers();
    const nuncaTermina = new Promise<number>(() => {});
    const resultado = expect(withTimeout(nuncaTermina, 1000, () => new Error('tiempo'))).rejects.toThrow('tiempo');
    await vi.advanceTimersByTimeAsync(1000);
    await resultado;
  });

  it('no rechaza justo antes del limite', async () => {
    vi.useFakeTimers();
    let resolver: (n: number) => void = () => {};
    const lenta = new Promise<number>((r) => (resolver = r));
    const p = withTimeout(lenta, 1000, () => new Error('tiempo'));
    await vi.advanceTimersByTimeAsync(999);
    resolver(7);
    await expect(p).resolves.toBe(7);
  });

  it('limpia el temporizador cuando termina', async () => {
    vi.useFakeTimers();
    await withTimeout(Promise.resolve(1), 1000, () => new Error('tiempo'));
    expect(vi.getTimerCount()).toBe(0);
  });
});
