import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniStudio",
  description: "Chat com provedores gratuitos, estúdio de vídeo 2D e modo agente. Criado por SysArchX.",
  applicationName: "OmniStudio",
  authors: [{ name: "SysArchX", url: "https://github.com/SysArchX" }],
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="obsidian" data-density="comfortable" data-perf="off">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
