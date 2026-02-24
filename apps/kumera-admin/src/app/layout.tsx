import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kumera Admin",
  description: "Unified administration for Kumera Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="shell-header">
          <h1>Kumera Admin</h1>
          <nav>
            <Link href="/admin/roles">Roles</Link>
            <Link href="/admin/subscriptions">Subscriptions</Link>
          </nav>
        </header>
        <main className="shell-main">{children}</main>
      </body>
    </html>
  );
}
