import type { NativeBridge } from "./types";

export type PlatformKind = "desktop" | "android" | "web";

export interface PlatformInfo {
  kind: PlatformKind;
  label: string;
  native: boolean;
  bridge: NativeBridge | null;
}

interface CapacitorWindow extends Window {
  Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean };
  omniNative?: NativeBridge;
}

export function detectPlatform(): PlatformInfo {
  if (typeof window === "undefined") {
    return { kind: "web", label: "Servidor", native: false, bridge: null };
  }
  const win = window as CapacitorWindow;
  if (win.omniNative) {
    return {
      kind: "desktop",
      label: "App desktop",
      native: true,
      bridge: win.omniNative,
    };
  }
  const capacitorPlatform = win.Capacitor?.getPlatform?.();
  if (capacitorPlatform === "android") {
    return { kind: "android", label: "Android", native: true, bridge: null };
  }
  if (capacitorPlatform === "ios") {
    return { kind: "android", label: "iOS", native: true, bridge: null };
  }
  return { kind: "web", label: "Navegador", native: false, bridge: null };
}

export const SAFE_COMMANDS = [
  "python",
  "python3",
  "node",
  "npm",
  "git",
  "ls",
  "cat",
  "pacman",
  "apt",
  "arduino-cli",
];

export function commandAllowed(command: string) {
  const first = command.trim().split(/\s+/)[0] ?? "";
  if (!first) return false;
  if (/[;&|><`$]/.test(command.replace(/"[^"]*"/g, ""))) return false;
  return SAFE_COMMANDS.includes(first);
}
