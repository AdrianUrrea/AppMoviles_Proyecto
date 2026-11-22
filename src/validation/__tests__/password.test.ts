import { describe, expect, it } from 'vitest';
import { MSG } from '../mensajes';
import { crearCambioPasswordSchema } from '../password';

const schema = crearCambioPasswordSchema('Ana@Correo.com');
const valido = { actual: 'ClaveVieja1', nueva: 'ClaveNueva9', confirmar: 'ClaveNueva9' };

function errores(datos: Partial<typeof valido>) {
  const r = schema.safeParse({ ...valido, ...datos });
  if (r.success) return {};
  const porCampo: Record<string, string[]> = {};
  for (const i of r.error.issues) (porCampo[String(i.path[0])] ??= []).push(i.message);
  return porCampo;
}

describe('cambio de contraseña', () => {
  it('acepta una contraseña nueva valida', () => {
    expect(schema.safeParse(valido).success).toBe(true);
  });

  it('la contraseña actual es obligatoria', () => {
    expect(errores({ actual: '' }).actual).toEqual([MSG.password.actualObligatoria]);
  });

  it('la nueva sigue las reglas del registro: obligatoria, minimo 8, maximo 72', () => {
    expect(errores({ nueva: '', confirmar: '' }).nueva).toContain(MSG.password.obligatoria);
    expect(errores({ nueva: 'corta1', confirmar: 'corta1' }).nueva).toEqual([MSG.password.muyCorta]);
    const larga = 'a'.repeat(73);
    expect(errores({ nueva: larga, confirmar: larga }).nueva).toEqual([MSG.password.muyLarga]);
    const limite = 'a'.repeat(72);
    expect(errores({ nueva: limite, confirmar: limite }).nueva).toBeUndefined();
  });

  it('la confirmacion es obligatoria y debe coincidir', () => {
    expect(errores({ confirmar: '' }).confirmar).toEqual([MSG.confirmPassword.obligatoria]);
    expect(errores({ confirmar: 'OtraClave99' }).confirmar).toEqual([MSG.confirmPassword.noCoincide]);
  });

  it('la nueva debe ser distinta de la actual', () => {
    expect(errores({ nueva: 'ClaveVieja1', confirmar: 'ClaveVieja1' }).nueva).toEqual([MSG.password.igualALaActual]);
  });

  it('la nueva no puede ser el correo (sin importar mayusculas ni espacios)', () => {
    expect(errores({ nueva: 'ana@correo.com', confirmar: 'ana@correo.com' }).nueva).toEqual([MSG.password.igualAlCorreo]);
    expect(errores({ nueva: ' Ana@Correo.com ', confirmar: ' Ana@Correo.com ' }).nueva).toEqual([MSG.password.igualAlCorreo]);
  });

  it('no repite errores por el mismo motivo ni inventa errores en la confirmacion', () => {
    const e = errores({ nueva: 'corta1', confirmar: 'corta1' });
    expect(e.confirmar).toBeUndefined();
    expect(e.nueva).toHaveLength(1);
  });

  it('las contraseñas no se recortan: los espacios cuentan como parte de la contraseña', () => {
    const r = schema.safeParse({ actual: 'ClaveVieja1', nueva: '  ClaveNueva9  ', confirmar: '  ClaveNueva9  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nueva).toBe('  ClaveNueva9  ');
  });

  it('sin correo en sesion igual valida el resto (no rompe)', () => {
    const s = crearCambioPasswordSchema('');
    expect(s.safeParse(valido).success).toBe(true);
  });
});
