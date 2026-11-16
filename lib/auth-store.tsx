"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { attachAuthListener, getSupabase, signInWithGoogle, signOut as revokeSession, toAuthSession } from "./auth";
import { useSettings } from "./settings-store";
import type { AuthSession } from "./types";

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  adoptSession: (session: AuthSession | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const config = settings.supabase;

  useEffect(() => {
    const supabase = getSupabase(config);
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(toAuthSession(data.session));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [config]);

  useEffect(() => attachAuthListener(config, setSession), [config]);

  const signIn = useCallback(async () => {
    await signInWithGoogle(config);
  }, [config]);

  const signOut = useCallback(async () => {
    await revokeSession(config, session);
    setSession(null);
  }, [config, session]);

  const value = useMemo(
    () => ({
      session,
      ready,
      authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      signIn,
      signOut,
      adoptSession: setSession,
    }),
    [session, ready, authOpen, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}