export const APP_NAME = "OmniStudio";
export const APP_VERSION = "1.5.3";
export const OWNER = "SysArchX";
export const REPO = "OmniStudio";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const RELEASES_URL = `${REPO_URL}/releases/latest`;
export const PROFILE_URL = `https://github.com/${OWNER}`;
export const WEB_URL = "https://site-18ac632e87d148d6ac36f5819bc6945b.freebuff.page";
export const SHORT_URL = "https://is.gd/omnistudio";
export const SHORT_URL_ALT = "https://is.gd/omnistudioai";

export const ASSETS = {
  win: "OmniStudio-Setup.exe",
  deb: "OmniStudio.deb",
  pacman: "OmniStudio.pacman",
  apk: "OmniStudio.apk",
  ipa: "OmniStudio-iOS.ipa",
  cli: "omnistudio-linux-cli.tar.gz",
  pkgbuild: "PKGBUILD",
} as const;

export type AssetKey = keyof typeof ASSETS;

export const DOWNLOADS: Array<{
  key: AssetKey;
  label: string;
  platform: string;
  detail: string;
  command?: string;
}> = [
  { key: "win", label: "Windows", platform: "10 e 11", detail: "Instalador NSIS com atalho e desinstalador" },
  {
    key: "deb",
    label: "Debian e Ubuntu",
    platform: "amd64",
    detail: "Pacote .deb com dependências resolvidas",
    command: "sudo apt install ./OmniStudio.deb",
  },
  {
    key: "pacman",
    label: "Arch Linux",
    platform: "x86_64",
    detail: "Pacote gerado pelo PKGBUILD",
    command: "sudo pacman -U OmniStudio.pacman",
  },
  { key: "apk", label: "Android", platform: "7.0+", detail: "APK universal com WebView" },
  { key: "ipa", label: "iPhone e iPad", platform: "iOS 15+", detail: "Pacote não assinado para instalar via AltStore" },
  {
    key: "cli",
    label: "Linux CLI",
    platform: "x86_64",
    detail: "Agente de terminal com sessão remota",
    command: "tar -xzf omnistudio-linux-cli.tar.gz",
  },
];

export function downloadUrl(asset: AssetKey) {
  return `${RELEASES_URL}/download/${ASSETS[asset]}`;
}

export const PKGBUILD_URL = `${REPO_URL}/raw/main/packaging/arch/PKGBUILD`;

export const ECOSYSTEM = [
  {
    name: "FastSearchX",
    repo: "FastSearchX",
    description: "Navegador com download de vídeo, áudio e arquivos. Flutter no Android e iOS, GTK no Linux.",
  },
  {
    name: "WinIso-NG",
    repo: "WinIso-NG",
    description: "Grava ISOs do Windows em pendrive bootável no Linux, com interface wxPython.",
  },
];

export const TECH_STACK = ["Next.js 16", "React 19", "TypeScript", "Tailwind 4", "Canvas 2D", "Electron", "Capacitor", "Supabase"];
