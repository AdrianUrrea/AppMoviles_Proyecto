import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { LONGITUD_CODIGO } from '../codigo';
import { codigoSchema, loginSchema } from '../login';
import { MSG } from '../mensajes';
import { calcularDigitoVerificador } from '../rfc';
import { REGISTRO_DEFAULTS, registroSchema } from '../registro';
import type { RegistroFormValues } from '../registro';

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 22, 12, 0, 0));
});
afterAll(() => vi.useRealTimers());

const rfcValido = 'GODE561231GR8'; // nacimiento 1956-12-31

const valido: RegistroFormValues = {
  correo: 'ana@correo.com',
  password: 'secreta123',
  confirmPassword: 'secreta123',
  nombre: 'Eduardo',
  apellidoPaterno: 'Gómez',
  apellidoMaterno: 'Díaz',
  nacimiento: '1956-12-31',
  rfc: rfcValido,
  calle: 'Av. Reforma',
  numExt: '120',
  numInt: '',
  colonia: 'Centro',
  cp: '22800',
  municipio: 'Ensenada',
  estado: 'Baja California',
  aceptoPrivacidad: true,
};

/** Errores por campo (primer mensaje de cada uno). */
function errores(datos: Partial<RegistroFormValues>): Record<string, string> {
  const r = registroSchema.safeParse({ ...valido, ...datos });
  if (r.success) return {};
  const out: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const campo = String(issue.path[0] ?? '_');
    if (!(campo in out)) out[campo] = issue.message;
  }
  return out;
}

describe('registroSchema: caso feliz', () => {
  it('acepta datos validos y normaliza', () => {
    const r = registroSchema.safeParse({
      ...valido,
      correo: '  ANA@Correo.COM ',
      rfc: ' gode561231gr8 ',
      nombre: '  Eduardo ',
      apellidoMaterno: '',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.correo).toBe('ana@correo.com');
      expect(r.data.rfc).toBe('GODE561231GR8');
      expect(r.data.nombre).toBe('Eduardo');
    }
  });

  it('acepta apellido materno y numero interior vacios', () => {
    expect(errores({ apellidoMaterno: '', numInt: '' })).toEqual({});
  });
});

describe('registroSchema: obligatorios (formulario vacio)', () => {
  it('marca todos los campos obligatorios', () => {
    const r = registroSchema.safeParse(REGISTRO_DEFAULTS);
    expect(r.success).toBe(false);
    const e = errores(REGISTRO_DEFAULTS);
    expect(e.correo).toBe(MSG.correo.obligatorio);
    expect(e.password).toBe(MSG.password.obligatoria);
    expect(e.confirmPassword).toBe(MSG.confirmPassword.obligatoria);
    expect(e.nombre).toBe(MSG.nombre.obligatorio);
    expect(e.apellidoPaterno).toBe(MSG.apellidoPaterno.obligatorio);
    expect(e.nacimiento).toBe(MSG.nacimiento.obligatoria);
    expect(e.rfc).toBe(MSG.rfc.obligatorio);
    expect(e.calle).toBe(MSG.domicilio.calle);
    expect(e.numExt).toBe(MSG.domicilio.numExt);
    expect(e.colonia).toBe(MSG.domicilio.colonia);
    expect(e.cp).toBe(MSG.domicilio.cpObligatorio);
    expect(e.municipio).toBe(MSG.domicilio.municipio);
    expect(e.estado).toBe(MSG.domicilio.estado);
    expect(e.aceptoPrivacidad).toBe(MSG.privacidad.obligatoria);
  });

  it('un campo solo con espacios cuenta como vacio', () => {
    expect(errores({ nombre: '   ' }).nombre).toBe(MSG.nombre.obligatorio);
  });
});

describe('registroSchema: correo', () => {
  it.each(['sin-arroba', 'a@b', 'a b@c.com', '@c.com', 'a@.com'])('rechaza "%s"', (correo) => {
    expect(errores({ correo }).correo).toBe(MSG.correo.invalido);
  });
  it('acepta alias con + y subdominios', () => {
    expect(errores({ correo: 'ana+tienda@mail.ejemplo.com.mx', password: 'otra-clave-1', confirmPassword: 'otra-clave-1' })).toEqual({});
  });
});

describe('registroSchema: contrasena', () => {
  it('exige 8 caracteres (7 falla, 8 pasa)', () => {
    expect(errores({ password: '1234567', confirmPassword: '1234567' }).password).toBe(MSG.password.muyCorta);
    expect(errores({ password: '12345678', confirmPassword: '12345678' })).toEqual({});
  });
  it('acepta espacios y emojis', () => {
    expect(errores({ password: 'mi clave 😀 12', confirmPassword: 'mi clave 😀 12' })).toEqual({});
  });
  it('rechaza mas de 72 caracteres', () => {
    const larga = 'a'.repeat(73);
    expect(errores({ password: larga, confirmPassword: larga }).password).toBe(MSG.password.muyLarga);
  });
  it('rechaza contrasena igual al correo', () => {
    expect(
      errores({ correo: 'ana12345@correo.com', password: 'ana12345@correo.com', confirmPassword: 'ana12345@correo.com' }).password,
    ).toBe(MSG.password.igualAlCorreo);
  });
  it('rechaza confirmacion distinta', () => {
    expect(errores({ confirmPassword: 'otra-cosa-123' }).confirmPassword).toBe(MSG.confirmPassword.noCoincide);
  });
  it('muestra el error de confirmacion aunque otros campos tengan errores', () => {
    const e = errores({ correo: 'malo', confirmPassword: 'distinta123' });
    expect(e.correo).toBe(MSG.correo.invalido);
    expect(e.confirmPassword).toBe(MSG.confirmPassword.noCoincide);
  });
});

describe('registroSchema: nombres', () => {
  it.each(["José Ángel", "O'Connor", 'María-Fernanda', 'Muñoz', 'Peña Nieto', 'Ünal'])('acepta "%s"', (nombre) => {
    expect(errores({ nombre }).nombre).toBeUndefined();
  });
  it.each(['Ana 2', 'Juan😀', '123', '-Ana', 'Ana@'])('rechaza "%s"', (nombre) => {
    expect(errores({ nombre }).nombre).toBe(MSG.nombre.invalido);
  });
  it('rechaza nombres de mas de 60 caracteres', () => {
    expect(errores({ nombre: 'A'.repeat(61) }).nombre).toBe(MSG.nombre.muyLargo);
  });
  it('valida el apellido materno solo si se escribe', () => {
    expect(errores({ apellidoMaterno: 'R0driguez' }).apellidoMaterno).toBe(MSG.apellidoMaterno.invalido);
  });
});

describe('registroSchema: nacimiento y RFC', () => {
  it('rechaza menor de edad, futura e inexistente', () => {
    expect(errores({ nacimiento: '2015-01-01' }).nacimiento).toBe(MSG.nacimiento.menorDeEdad);
    expect(errores({ nacimiento: '2030-01-01' }).nacimiento).toBe(MSG.nacimiento.futura);
    expect(errores({ nacimiento: '2001-02-30' }).nacimiento).toBe(MSG.nacimiento.invalida);
  });
  it('rechaza RFC que no coincide con la fecha de nacimiento', () => {
    expect(errores({ nacimiento: '1990-01-01' }).rfc).toBe(MSG.rfc.noCoincideConNacimiento);
  });
  it('no duplica errores: si el RFC es invalido no compara fechas', () => {
    expect(errores({ rfc: 'GODE561231GR9' }).rfc).toBe(MSG.rfc.digitoVerificador);
  });
  it('rechaza RFC generico y de persona moral', () => {
    expect(errores({ rfc: 'XAXX010101000' }).rfc).toBe(MSG.rfc.generico);
    expect(errores({ rfc: 'ABC010101AB1' }).rfc).toBe(MSG.rfc.longitud);
  });
  it('acepta RFC con N con tilde si coincide con la fecha', () => {
    const base = 'ÑAVA800101AB';
    expect(errores({ rfc: base + calcularDigitoVerificador(base), nacimiento: '1980-01-01' })).toEqual({});
  });
});

describe('registroSchema: domicilio y privacidad', () => {
  it('exige codigo postal de 5 digitos', () => {
    expect(errores({ cp: '2280' }).cp).toBe(MSG.domicilio.cpInvalido);
    expect(errores({ cp: '228000' }).cp).toBe(MSG.domicilio.cpInvalido);
    expect(errores({ cp: '22A00' }).cp).toBe(MSG.domicilio.cpInvalido);
    expect(errores({ cp: '01000' }).cp).toBeUndefined(); // ceros a la izquierda
  });
  it('exige aceptar el aviso de privacidad', () => {
    expect(errores({ aceptoPrivacidad: false }).aceptoPrivacidad).toBe(MSG.privacidad.obligatoria);
  });
});

describe('loginSchema y codigoSchema', () => {
  it('login: exige correo valido y contrasena (sin regla de 8)', () => {
    expect(loginSchema.safeParse({ correo: 'a@b.co', password: '1' }).success).toBe(true);
    const r = loginSchema.safeParse({ correo: 'x', password: '' });
    expect(r.success).toBe(false);
  });
  it('codigo: exactamente LONGITUD_CODIGO digitos', () => {
    const ok = '1'.repeat(LONGITUD_CODIGO);
    expect(codigoSchema.safeParse({ codigo: ok }).success).toBe(true);
    expect(codigoSchema.safeParse({ codigo: ` ${ok} ` }).success).toBe(true);
    expect(codigoSchema.safeParse({ codigo: ok.slice(1) }).success).toBe(false); // uno menos
    expect(codigoSchema.safeParse({ codigo: ok + '1' }).success).toBe(false); // uno mas
    expect(codigoSchema.safeParse({ codigo: ok.slice(1) + 'a' }).success).toBe(false);
    expect(codigoSchema.safeParse({ codigo: '' }).success).toBe(false);
  });
});
