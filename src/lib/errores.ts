/** true si el error parece un fallo de red (sin conexion, timeout, DNS). */
export function esErrorDeRed(error: unknown): boolean {
  const mensaje = String((error as { message?: unknown } | null)?.message ?? '');
  return /fetch failed|network request failed|failed to fetch|timed? ?out|unable to resolve host/i.test(mensaje);
}
