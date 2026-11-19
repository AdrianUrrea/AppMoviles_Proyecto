import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { clearPendingEmail, loadPendingEmail, savePendingEmail } from '@/lib/pendingVerification';
import { cancelarTodasLasNotificaciones } from '@/services/notificaciones';

type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

type SessionContextValue = {
  status: SessionStatus;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  /** Correo con registro pendiente de confirmar (se restaura al reabrir la app). */
  pendingEmail: string | null;
  setPendingEmail: (correo: string | null) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [pendingEmail, setPendingEmailState] = useState<string | null>(null);
  const [pendingLoading, setPendingLoading] = useState(true);

  // Restaurar el correo pendiente guardado.
  useEffect(() => {
    let active = true;
    loadPendingEmail()
      .then((correo) => {
        if (active) setPendingEmailState(correo);
      })
      .finally(() => {
        if (active) setPendingLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    // 1) Restaurar la sesion guardada al abrir la app.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setSessionLoading(false);
      });

    // 2) Escuchar cambios (login, logout, renovacion, verificacion de OTP).
    //    No se hace await de llamadas a Supabase dentro del callback.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setSessionLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Sin sesion, este telefono no debe conservar avisos de recordatorios de una cuenta anterior.
  useEffect(() => {
    if (!sessionLoading && !session) void cancelarTodasLasNotificaciones();
  }, [session, sessionLoading]);

  // Con sesion abierta ya no hay nada pendiente de confirmar.
  useEffect(() => {
    if (session) {
      setPendingEmailState(null);
      void clearPendingEmail();
    }
  }, [session]);

  const setPendingEmail = useCallback((correo: string | null) => {
    setPendingEmailState(correo);
    if (correo) void savePendingEmail(correo);
    else void clearPendingEmail();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const loading = sessionLoading || pendingLoading;

  const value = useMemo<SessionContextValue>(
    () => ({
      status: loading ? 'loading' : session ? 'signedIn' : 'signedOut',
      session,
      user: session?.user ?? null,
      signOut,
      pendingEmail,
      setPendingEmail,
    }),
    [loading, session, signOut, pendingEmail, setPendingEmail],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>.');
  return ctx;
}
