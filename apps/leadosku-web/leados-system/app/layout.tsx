import './globals.css';
import './kumi.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kumi — Tu primer filtro comercial por WhatsApp | Kumera Messaging',
  description:
    'Kumi pre califica tus contactos por WhatsApp, filtra conversaciones poco útiles y escala a tu equipo cuando aparece una oportunidad real. Servicio gestionado por Kumera.',
  keywords: [
    'WhatsApp Business',
    'pre calificación',
    'filtro comercial',
    'automatización WhatsApp',
    'bot WhatsApp',
    'Kumera',
    'Kumi',
    'leads WhatsApp',
    'pymes Chile',
  ],
  openGraph: {
    title: 'Kumi — Tu primer filtro comercial por WhatsApp',
    description:
      'Menos tiempo respondiendo, más tiempo cerrando ventas. Kumi pre califica tus contactos por WhatsApp automáticamente.',
    type: 'website',
    locale: 'es_CL',
    siteName: 'Kumi by Kumera',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
