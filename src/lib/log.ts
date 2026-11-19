/** Solo en desarrollo: imprime el error original en la terminal de Metro (los mensajes de la app lo esconden a proposito). */
export function logDev(contexto: string, error: unknown): void {
  if (!__DEV__) return;
  const e = (error ?? {}) as { name?: string; message?: string; status?: number; statusCode?: string | number; code?: string };
  console.warn(
    `[${contexto}]`,
    `name=${e.name}`,
    `status=${e.status ?? e.statusCode}`,
    `code=${e.code}`,
    `message=${e.message ?? String(error)}`,
  );
}
