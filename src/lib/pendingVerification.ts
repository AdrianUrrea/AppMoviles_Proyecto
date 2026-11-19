import * as SecureStore from 'expo-secure-store';
import { leerPendiente, serializarPendiente } from './pendingLogic';

const KEY = 'pending-verification';

/** Correo con registro pendiente de confirmar (para reabrir la app en la pantalla de confirmacion). */
export async function loadPendingEmail(): Promise<string | null> {
  try {
    const correo = leerPendiente(await SecureStore.getItemAsync(KEY), Date.now());
    if (!correo) await SecureStore.deleteItemAsync(KEY).catch(() => {});
    return correo;
  } catch {
    return null;
  }
}

export async function savePendingEmail(correo: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, serializarPendiente(correo, Date.now()));
  } catch {
    // Si falla el guardado, solo se pierde la restauracion al reabrir; el flujo normal sigue.
  }
}

export async function clearPendingEmail(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // nada que hacer
  }
}
