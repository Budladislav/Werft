import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Верфь", template: "%s — Верфь" },
  description: "Личный центр управления экосистемой проектов.",
  applicationName: "Верфь",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/werft.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f1f0e9",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <ServiceWorkerRegistration />
        <DataProvider>
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
