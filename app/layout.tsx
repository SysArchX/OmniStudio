import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/jetbrains-mono";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "OmniStudio",
  description: "Chat com provedores gratuitos, estúdio de vídeo 2D e modo agente. Criado por SysArchX.",
  applicationName: "OmniStudio",
  authors: [{ name: "SysArchX", url: "https://github.com/SysArchX" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192" },
      { url: "/icon-512.png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "OmniStudio", statusBarStyle: "black-translucent" },
};

export const dynamic = "force-static";

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="obsidian" data-density="comfortable" data-perf="off">
      <body className="min-h-screen antialiased">
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
