import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kumera Messaging',
  description: 'Kumera Messaging para calificacion y gestion de conversaciones comerciales'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
