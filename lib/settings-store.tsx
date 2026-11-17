"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppSettings, Density, GithubConfig, SupabaseConfig, ThemeId } from "./types";

const STORAGE_KEY = "omnistudio.settings.v1";

export const ACCENTS = [
  { id: "neutral", value: "#e4e4e7", label: "Neutro" },
  { id: "blue", value: "#93c5fd", label: "Azul" },
  { id: "amber", value: "#fcd34d", label: "Âmbar" },
  { id: "rose", value: "#fca5a5", label: "Rosa" },
  { id: "mint", value: "#86efac", label: "Verde" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  keys: { openrouter: "", groq: "", mistral: "", composio: "" },
  fallback: true,
  theme: "obsidian",
  accent: "#e4e4e7",
  density: "comfortable",
  performance: false,
  voiceURI: null,
  rate: 1.02,
  sfxVolume: 0.6,
  openrouterModel: "auto",
  profile: { name: "SysArchX", email: "" },
  supabase: { 
    url: "https://xwbpajtyqhzkxvoxnsyp.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YnBhanR5cWh6a3h2b3huc3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3Njk1MjYsImV4cCI6MjExMDM0NTUyNn0.PQmxqo34NAox3lEI4KRoAvP5MZ_UCzOxae4S6uRQ_Q4",
    enabled: true
  },
  github: { token: "", repo: "SysArchX/OmniStudio" },
};

interface SettingsContextValue {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
  updateKeys: (patch: Partial<AppSettings["keys"]>) => void;
  updateSupabase: (patch: Partial<SupabaseConfig>) => void;
  updateGithub: (patch: Partial<GithubConfig>) => void;
  updateProfile: (patch: Partial<AppSettings["profile"]>) => void;
  setTheme: (theme: ThemeId) => void;
  setDensity: (density: Density) => void;
  reset: () => void;
  loaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings precisa estar dentro de SettingsProvider");
  return ctx;
}

function accentInk(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num)) return "#0a0a0a";
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.58 ? "#0a0a0a" : "#fafafa";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Aplica credenciais padrão se localStorage estiver vazio ou sem config supabase
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const hasSupabaseConfig = raw ? JSON.parse(raw)?.supabase?.url?.trim() && JSON.parse(raw)?.supabase?.anonKey?.trim() : false;
      if (!raw || !hasSupabaseConfig) {
        // Mantém credenciais padrão quando não há salvamento ou config inválida
        setSettings(DEFAULT_SETTINGS);
      }
    } catch {
      /* armazenamento indisponível */
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppSettings>;
        setSettings({
          ...DEFAULT_SETTINGS,
          ...saved,
          keys: { ...DEFAULT_SETTINGS.keys, ...(saved.keys ?? {}) },
          profile: { ...DEFAULT_SETTINGS.profile, ...(saved.profile ?? {}) },
          supabase: { ...DEFAULT_SETTINGS.supabase, ...(saved.supabase ?? {}) },
          github: { ...DEFAULT_SETTINGS.github, ...(saved.github ?? {}) },
        });
      }
    } catch {
      /* armazenamento indisponível */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* quota cheia */
    }
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.density = settings.density;
    root.dataset.perf = settings.performance ? "on" : "off";
    root.style.setProperty("--accent", settings.accent);
    root.style.setProperty("--accent-ink", accentInk(settings.accent));
    root.style.setProperty("--accent-soft", `color-mix(in srgb, ${settings.accent} 14%, transparent)`);
    root.style.colorScheme = settings.theme === "light" ? "light" : "dark";
  }, [settings, loaded]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateKeys = useCallback((patch: Partial<AppSettings["keys"]>) => {
    setSettings((prev) => ({ ...prev, keys: { ...prev.keys, ...patch } }));
  }, []);

  const updateSupabase = useCallback((patch: Partial<SupabaseConfig>) => {
    setSettings((prev) => ({ ...prev, supabase: { ...prev.supabase, ...patch } }));
  }, []);

  const updateGithub = useCallback((patch: Partial<GithubConfig>) => {
    setSettings((prev) => ({ ...prev, github: { ...prev.github, ...patch } }));
  }, []);

  const updateProfile = useCallback((patch: Partial<AppSettings["profile"]>) => {
    setSettings((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const setTheme = useCallback((theme: ThemeId) => setSettings((prev) => ({ ...prev, theme })), []);
  const setDensity = useCallback((density: Density) => setSettings((prev) => ({ ...prev, density })), []);
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(
    () => ({
      settings,
      update,
      updateKeys,
      updateSupabase,
      updateGithub,
      updateProfile,
      setTheme,
      setDensity,
      reset,
      loaded,
    }),
    [settings, update, updateKeys, updateSupabase, updateGithub, updateProfile, setTheme, setDensity, reset, loaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
