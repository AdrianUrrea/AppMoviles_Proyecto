/**
 * Rechaza con `onTimeout()` si `promise` no termina en `ms` milisegundos.
 * Evita que un boton quede cargando para siempre cuando la red se cuelga.
 * Nota: no cancela la peticion original; solo deja de esperarla.
 */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number, onTimeout: () => Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(onTimeout()), ms);
    Promise.resolve(promise).then(
      (valor) => {
        clearTimeout(id);
        resolve(valor);
      },
      (error) => {
        clearTimeout(id);
        reject(error);
      },
    );
  });
}
