import { describe, expect, it } from 'vitest';
import { MSG } from '../mensajes';
import {
  calcularDigitoVerificador,
  rfcCoincideConNacimiento,
  validarRfc,
} from '../rfc';

/** Construye un RFC con digito verificador correcto a partir de 12 caracteres. */
const conDv = (base12: string) => base12 + calcularDigitoVerificador(base12);

describe('calcularDigitoVerificador', () => {
  it('coincide con el RFC de ejemplo del SAT (GODE561231GR8)', () => {
    expect(calcularDigitoVerificador('GODE561231GR')).toBe('8');
  });
});

describe('validarRfc', () => {
  it('acepta un RFC valido, tambien en minusculas y con espacios', () => {
    expect(validarRfc('GODE561231GR8')).toBeNull();
    expect(validarRfc('  gode561231gr8 ')).toBeNull();
  });

  it('exige el campo', () => {
    expect(validarRfc('')).toBe(MSG.rfc.obligatorio);
    expect(validarRfc('   ')).toBe(MSG.rfc.obligatorio);
  });

  it('rechaza longitudes distintas de 13 (incluye persona moral de 12)', () => {
    expect(validarRfc('GODE561231GR')).toBe(MSG.rfc.longitud);
    expect(validarRfc('ABC010101AB1')).toBe(MSG.rfc.longitud);
    expect(validarRfc('GODE561231GR88')).toBe(MSG.rfc.longitud);
  });

  it('rechaza RFC genericos', () => {
    expect(validarRfc('XAXX010101000')).toBe(MSG.rfc.generico);
    expect(validarRfc('XEXX010101000')).toBe(MSG.rfc.generico);
  });

  it('rechaza formato invalido', () => {
    expect(validarRfc('1ODE561231GR8')).toBe(MSG.rfc.formato); // digito en las letras
    expect(validarRfc('GODE56123XGR8')).toBe(MSG.rfc.formato); // letra en la fecha
    expect(validarRfc('GODE561331GR8')).toBe(MSG.rfc.formato); // mes 13
    expect(validarRfc('GODE561200GR8')).toBe(MSG.rfc.formato); // dia 00
    expect(validarRfc('GODE561232GR8')).toBe(MSG.rfc.formato); // dia 32
    expect(validarRfc('GODE561231G-8')).toBe(MSG.rfc.formato); // simbolo
    expect(validarRfc('GODE 61231GR8')).toBe(MSG.rfc.formato); // espacio interno
  });

  it('rechaza digito verificador incorrecto', () => {
    expect(validarRfc('GODE561231GR9')).toBe(MSG.rfc.digitoVerificador);
  });

  it('acepta N con tilde y ampersand en las letras', () => {
    expect(validarRfc(conDv('ÑAVA800101AB'))).toBeNull();
    expect(validarRfc(conDv('ñava800101ab'.toUpperCase()))).toBeNull();
    expect(validarRfc(conDv('&AVA800101AB'))).toBeNull();
  });

  it('el digito verificador puede ser A', () => {
    // Buscar una homoclave cuyo DV sea 'A' para cubrir esa rama.
    let encontrado: string | null = null;
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
      const base = `GODE561231G${c}`;
      if (calcularDigitoVerificador(base) === 'A') {
        encontrado = conDv(base);
        break;
      }
    }
    expect(encontrado).not.toBeNull();
    expect(validarRfc(encontrado as string)).toBeNull();
  });
});

describe('rfcCoincideConNacimiento', () => {
  it('compara la fecha del RFC con la de nacimiento', () => {
    expect(rfcCoincideConNacimiento('GODE561231GR8', '1956-12-31')).toBe(true);
    expect(rfcCoincideConNacimiento('gode561231gr8', '1956-12-31')).toBe(true);
    expect(rfcCoincideConNacimiento('GODE561231GR8', '1956-12-30')).toBe(false);
    expect(rfcCoincideConNacimiento('GODE561231GR8', '1957-12-31')).toBe(false);
  });
  it('funciona para nacidos despues de 2000 sin adivinar el siglo', () => {
    expect(rfcCoincideConNacimiento(conDv('PEPJ030615AB'), '2003-06-15')).toBe(true);
    expect(rfcCoincideConNacimiento(conDv('PEPJ030615AB'), '1903-06-15')).toBe(true); // mismo YYMMDD
  });
  it('devuelve false si la fecha de nacimiento es invalida', () => {
    expect(rfcCoincideConNacimiento('GODE561231GR8', 'xx')).toBe(false);
  });
});
