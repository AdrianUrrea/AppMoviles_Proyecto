import { describe, expect, it } from 'vitest';
import { desplazamientoParaVer } from '../teclado';

// Zona visible de ejemplo: de y=100 (bajo el encabezado) a y=500 (sobre el teclado).
const zona = { zonaArriba: 100, zonaAbajo: 500, margen: 24 };

describe('desplazamientoParaVer', () => {
  it('campo ya visible: no se mueve nada', () => {
    expect(desplazamientoParaVer({ ...zona, campoArriba: 200, campoAbajo: 248 })).toBe(0);
  });

  it('campo tapado por el teclado: baja el contenido lo justo, con margen', () => {
    // el campo termina en 560 y la zona en 500: faltan 60 + 24 de margen
    expect(desplazamientoParaVer({ ...zona, campoArriba: 512, campoAbajo: 560 })).toBe(84);
  });

  it('campo a medias detras del teclado', () => {
    expect(desplazamientoParaVer({ ...zona, campoArriba: 470, campoAbajo: 518 })).toBe(42);
  });

  it('campo justo en el limite: el margen tambien cuenta', () => {
    expect(desplazamientoParaVer({ ...zona, campoArriba: 428, campoAbajo: 476 })).toBe(0);
    expect(desplazamientoParaVer({ ...zona, campoArriba: 430, campoAbajo: 478 })).toBe(2);
  });

  it('campo escondido bajo el encabezado: sube el contenido', () => {
    expect(desplazamientoParaVer({ ...zona, campoArriba: 90, campoAbajo: 138 })).toBe(-34);
  });

  it('campo mas alto que la zona visible: se muestra su parte de arriba', () => {
    // zona de 400 px y campo de 600: no cabe; el borde de arriba queda en zonaArriba + margen
    expect(desplazamientoParaVer({ ...zona, campoArriba: 300, campoAbajo: 900 })).toBe(176);
  });

  it('nunca saca el inicio del campo por arriba al bajar', () => {
    // el campo ya esta arriba de la zona + margen pero su fondo queda tapado: no hay que bajar mas
    expect(desplazamientoParaVer({ ...zona, campoArriba: 110, campoAbajo: 700 })).toBe(0);
  });

  it('medidas invalidas (NaN, Infinity): no hace nada', () => {
    expect(desplazamientoParaVer({ ...zona, campoArriba: NaN, campoAbajo: 300 })).toBe(0);
    expect(desplazamientoParaVer({ ...zona, campoArriba: 200, campoAbajo: Infinity })).toBe(0);
  });
});
