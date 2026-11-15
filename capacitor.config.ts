import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sysarchx.omnistudio",
  appName: "OmniStudio",
  webDir: "out",
  android: {
    allowMixedContent: false,
    backgroundColor: "#09090b",
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
