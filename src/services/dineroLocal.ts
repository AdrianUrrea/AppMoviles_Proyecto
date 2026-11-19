import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  claveDeLocal,
  claveLocal,
  conEnviado,
  leerRegistro,
  partesDeClave,
  prefijoDeUsuario,
  registroEstaVacio,
  resumenDe,
  serializarRegistro,
} from '@/dinero/local';
import type { RegistroLocal, ResumenLocal } from '@/dinero/local';
import type { TipoDato } from '@/dinero/formularios';
import { largeSecureStore } from '@/lib/largeSecureStore';
import { logDev } from '@/lib/log';
import { guardarCaptura } from '@/services/datosDinero';

/**
 * Copia de los datos de dinero en el telefono (cifrada: AES-256 con la llave en SecureStore, igual que la sesion).
 * Una entrada por usuario y formulario: "dinero.<id de usuario>.<clave>". Otra cuenta en el mismo telefono no la ve.
 *
 * TODA lectura y escritura pasa por una sola cola, para que el guardado de borradores y la sincronizacion
 * no se pisen entre si.
 */

const REINTENTO_MS = 60_000;

let cola: Promise<unknown> = Promise.resolve();
function enCola<T>(tarea: () => Promise<T>): Promise<T> {
  const siguiente = cola.then(tarea);
  cola = siguiente.catch(() => undefined);
  return siguiente;
}

// ---- aviso de cambios (la pantalla se actualiza sola cuando termina una sincronizacion)

const oyentes = new Set<() => void>();
export function suscribirCambiosLocales(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}
function avisar(): void {
  for (const o of oyentes) {
    try {
      o();
    } catch (e) {
      logDev('dinero-oyente', e);
    }
  }
}

// ---- lectura y escritura

async function leer(uid: string, clave: string, tipo: TipoDato): Promise<RegistroLocal> {
  return leerRegistro(await largeSecureStore.getItem(claveLocal(uid, clave)), tipo);
}

async function escribir(uid: string, clave: string, registro: RegistroLocal): Promise<void> {
  const llave = claveLocal(uid, clave);
  if (registroEstaVacio(registro)) await largeSecureStore.removeItem(llave);
  else await largeSecureStore.setItem(llave, serializarRegistro(registro));
}

export function leerRegistroLocal(uid: string, clave: string, tipo: TipoDato): Promise<RegistroLocal> {
  return enCola(() => leer(uid, clave, tipo));
}

/** Lee, aplica el cambio y escribe, todo seguido. Si `cambio` devuelve el mismo registro, no escribe nada. */
export function actualizarRegistroLocal(
  uid: string,
  clave: string,
  tipo: TipoDato,
  cambio: (actual: RegistroLocal) => RegistroLocal,
): Promise<RegistroLocal> {
  return enCola(async () => {
    const actual = await leer(uid, clave, tipo);
    const nuevo = cambio(actual);
    if (nuevo !== actual) {
      await escribir(uid, clave, nuevo);
      avisar();
    }
    return nuevo;
  });
}

async function clavesDeUsuario(uid: string): Promise<string[]> {
  const llaves = await AsyncStorage.getAllKeys();
  return llaves
    .map((l) => claveDeLocal(uid, l))
    .filter((c): c is string => c !== null && partesDeClave(c) !== null);
}

/** Un resumen por formulario que tenga algo guardado en el telefono. */
export function resumenesLocales(uid: string): Promise<ResumenLocal[]> {
  return enCola(async () => {
    const resumenes: ResumenLocal[] = [];
    for (const clave of await clavesDeUsuario(uid)) {
      const partes = partesDeClave(clave);
      if (!partes) continue;
      const resumen = resumenDe(clave, await leer(uid, clave, partes.tipo));
      if (resumen) resumenes.push(resumen);
    }
    return resumenes;
  });
}

/** Cuantos formularios tienen datos que solo existen en este telefono (pendientes de enviar o sin guardar). */
export async function contarCambiosSinEnviar(uid: string): Promise<number> {
  return (await resumenesLocales(uid)).filter((r) => r.pendiente || r.borrador).length;
}

// ---- sincronizacion

export type ResultadoSync = { enviados: number; pendientes: number };

let enCurso: Promise<ResultadoSync> | null = null;
let repetir = false;
let temporizador: ReturnType<typeof setTimeout> | null = null;

function cancelarReintento(): void {
  if (temporizador) clearTimeout(temporizador);
  temporizador = null;
}

/** Envia en orden cada formulario pendiente. Se detiene en el primer fallo (sin red, sesion vencida, etc.). */
async function pasada(uid: string): Promise<{ enviados: number; fallo: boolean }> {
  const pendientes = (await resumenesLocales(uid)).filter((r) => r.pendiente);
  let enviados = 0;
  for (const r of pendientes) {
    const actual = await leerRegistroLocal(uid, r.clave, r.tipo);
    if (!actual.pendiente || !actual.guardado) continue;
    const enviado = actual.guardado;
    try {
      await guardarCaptura(r.clave, enviado);
    } catch (e) {
      logDev('dinero-sync', e);
      return { enviados, fallo: true };
    }
    const despues = await actualizarRegistroLocal(uid, r.clave, r.tipo, (x) => conEnviado(x, enviado));
    if (despues.pendiente) repetir = true; // el usuario volvio a guardar mientras se enviaba
    else enviados += 1;
  }
  return { enviados, fallo: false };
}

/**
 * Sube lo pendiente. Nunca corren dos a la vez (si llega otra llamada, se pide una vuelta mas a la que esta en curso),
 * asi un envio viejo no puede terminar despues de uno nuevo y dejar datos anteriores en el servidor.
 * Si algo queda pendiente, reintenta solo cada minuto; tambien se reintenta al volver a abrir la app.
 */
export function sincronizarPendientes(uid: string): Promise<ResultadoSync> {
  if (enCurso) {
    repetir = true;
    return enCurso;
  }
  cancelarReintento();
  enCurso = (async () => {
    try {
      let enviados = 0;
      let fallo = false;
      do {
        repetir = false;
        const p = await pasada(uid);
        enviados += p.enviados;
        fallo = p.fallo;
      } while (repetir && !fallo);
      const pendientes = (await resumenesLocales(uid)).filter((r) => r.pendiente).length;
      if (pendientes > 0) temporizador = setTimeout(() => void sincronizarPendientes(uid).catch(() => undefined), REINTENTO_MS);
      avisar();
      return { enviados, pendientes };
    } finally {
      enCurso = null;
    }
  })();
  return enCurso;
}

/** Borra TODO lo que este telefono guarda de dinero de ese usuario (al cerrar sesion a proposito). */
export function borrarLocalDeUsuario(uid: string): Promise<void> {
  cancelarReintento();
  return enCola(async () => {
    const prefijo = prefijoDeUsuario(uid);
    const llaves = (await AsyncStorage.getAllKeys()).filter((l) => l.startsWith(prefijo));
    for (const llave of llaves) await largeSecureStore.removeItem(llave);
    avisar();
  });
}
