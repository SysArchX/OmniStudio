import type { NativeBridge } from "./lib/types";

declare global {
  interface Window {
    omniNative?: NativeBridge;
    Capacitor?: {
      getPlatform?: () => string;
      isNativePlatform?: () => boolean;
    };
  }
}

export {};
