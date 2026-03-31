import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { AppProviders } from "@/shared/ui/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "HUB Flexibase",
  description:
    "Hub empresarial interno para centralizar sistemas, documentos e comunicados da Flexibase.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      style={
        {
          "--font-body":
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          "--font-display":
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        } as CSSProperties
      }
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
