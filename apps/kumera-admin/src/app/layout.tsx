import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kumera Admin",
  description: "Unified administration for Kumera Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
