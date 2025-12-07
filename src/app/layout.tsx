// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode, CSSProperties } from "react";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CampusMarket",
  description: "Marketplace interno para universidades e empresas",
};

const bodyStyle: CSSProperties = {
  margin: 0,
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  backgroundColor: "#ffffff", // <<< AGORA FUNDO BRANCO
  color: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt">
      <body style={bodyStyle}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
