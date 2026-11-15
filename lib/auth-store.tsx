"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  attachAuthListener,
  loadSession,
  refreshSession,
  saveSession,
  signInWithGoogle,
  signOut as revokeSession,
  supabaseReady,
} from "./auth";
import { useSettings } from "./settings-store";
import type { AuthSession } from "./types";

const GUEST_KEY = "omnistudio.guest";

interface AuthContextValue {
  session: AuthSession | null;
  guest: boolean;
  ready: boolean;
  configured: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
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
  const [guest, setGuest] = useState(false);
  const [ready, setReady] = useState(false);

  const config = settings.supabase;
  const configured = supabaseReady(config);

  useEffect(() => {
    setSession(loadSession());
    try {
      setGuest(window.localStorage.getItem(GUEST_KEY) === "1");
    } catch {
      /* armazenamento indisponível */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!configured) return;
    return attachAuthListener(config, (next) => {
      setSession(next);
      setGuest(false);
      try {
        window.localStorage.removeItem(GUEST_KEY);
      } catch {
        /* ignora */
      }
    });
  }, [config, configured]);

  useEffect(() => {
    if (!session || !configured) return;
    const remaining = session.expiresAt - Date.now();
    if (!session.refreshToken || remaining > 60_000) return;
    refreshSession(config, session)
      .then((next) => setSession(next))
      .catch(() => setSession(null));
  }, [session, config, configured]);

  const signIn = useCallback(() => {
    try {
      signInWithGoogle(config);
    } catch {
      /* configuração ausente tratada na UI */
    }
  }, [config]);

  const signOut = useCallback(async () => {
    await revokeSession(config, session);
    setSession(null);
    saveSession(null);
  }, [config, session]);

  const continueAsGuest = useCallback(() => {
    setGuest(true);
    try {
      window.localStorage.setItem(GUEST_KEY, "1");
    } catch {
      /* ignora */
    }
  }, []);

  const value = useMemo(
    () => ({ session, guest, ready, configured, signIn, signOut, continueAsGuest, adoptSession: setSession }),
    [session, guest, ready, configured, signIn, signOut, continueAsGuest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
