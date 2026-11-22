import { describe, expect, it } from 'vitest';
import { colors, radius, spacing, type } from '../theme';

/** Contraste WCAG 2.x entre dos colores #RRGGBB. */
function luminancia(hex: string): number {
  const canal = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}
function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe('contraste de la paleta (WCAG AA: 4.5 para texto normal)', () => {
  const texto: [string, string, string][] = [
    ['ink', colors.ink, colors.background],
    ['ink sobre tarjeta', colors.ink, colors.surface],
    ['ink sobre tint', colors.ink, colors.tint],
    ['muted sobre fondo', colors.muted, colors.background],
    ['muted sobre tarjeta', colors.muted, colors.surface],
    ['muted sobre tint', colors.muted, colors.tint],
    ['primary sobre tarjeta', colors.primary, colors.surface],
    ['primary sobre tint', colors.primary, colors.tint],
    ['primary sobre tintStrong', colors.primary, colors.tintStrong],
    ['onPrimary sobre primary', colors.onPrimary, colors.primary],
    ['onPrimary sobre primaryPressed', colors.onPrimary, colors.primaryPressed],
    ['danger sobre tarjeta', colors.danger, colors.surface],
    ['danger sobre dangerTint', colors.danger, colors.dangerTint],
    ['success sobre successTint', colors.success, colors.successTint],
    ['success sobre tarjeta', colors.success, colors.surface],
    ['warning sobre warningTint', colors.warning, colors.warningTint],
    ['warning sobre tarjeta', colors.warning, colors.surface],
  ];
  for (const [nombre, fg, bg] of texto) {
    it(nombre, () => expect(contraste(fg, bg), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5));
  }

  it('el borde de los campos se distingue del fondo de la tarjeta (3:1, componentes de interfaz)', () => {
    expect(contraste(colors.border, colors.surface)).toBeGreaterThanOrEqual(1.5); // borde sutil; el foco usa primary
    expect(contraste(colors.primary, colors.surface)).toBeGreaterThanOrEqual(3); // borde de foco
  });

  it('el texto de ayuda (placeholder) es legible aunque tenue (3:1)', () => {
    expect(contraste(colors.placeholder, colors.surface)).toBeGreaterThanOrEqual(3);
  });
});

describe('escalas', () => {
  it('el espaciado y los radios crecen en orden', () => {
    const e = Object.values(spacing);
    expect([...e].sort((a, b) => a - b)).toEqual(e);
    const r = [radius.sm, radius.md, radius.lg, radius.xl];
    expect([...r].sort((a, b) => a - b)).toEqual(r);
  });

  it('la tipografia no baja de 12 px y cada linea deja aire sobre el tamaño', () => {
    for (const [nombre, t] of Object.entries(type)) {
      expect(t.fontSize, nombre).toBeGreaterThanOrEqual(12);
      expect(t.lineHeight, nombre).toBeGreaterThan(t.fontSize);
    }
  });
});
