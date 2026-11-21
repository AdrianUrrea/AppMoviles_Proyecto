import { createContext, useContext } from 'react';

/** Lo que `Screen` ofrece a los campos de texto de su interior. */
export type PantallaConTeclado = {
  /** Desplaza la pantalla (si hace falta) para que el campo enfocado quede visible sobre el teclado. */
  verCampoEnfocado: () => void;
};

export const TecladoContext = createContext<PantallaConTeclado | null>(null);

const nada = () => {};

/**
 * Funcion que cada campo de texto llama en `onFocus`. Fuera de una `Screen` no hace nada.
 * Usarla en TODO campo de texto nuevo, o el teclado podria taparlo en formularios largos.
 */
export function useVerCampoEnfocado(): () => void {
  return useContext(TecladoContext)?.verCampoEnfocado ?? nada;
}
