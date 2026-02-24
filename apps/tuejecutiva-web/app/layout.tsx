import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const inter = Inter({
  subsets: ["latin"],
});

const defaultTitle = "TuEjecutiva";
const defaultDescription =
  "Portal de confianza que conecta usuarios con ejecutivas de contratacion verificadas en Chile. Evita estafas y contacta profesionales validadas.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: defaultTitle,
    template: `%s | ${defaultTitle}`,
  },
  description: defaultDescription,
  keywords: [
    "ejecutivas verificadas",
    "ejecutivas de contratacion",
    "portal de confianza",
    "contratar planes",
    "asesoria de contratacion",
    "isapres",
    "seguros",
    "servicios hogar",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: defaultTitle,
    description: defaultDescription,
    siteName: "TuEjecutiva",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TuEjecutiva.cl",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/logo/logofavicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isOnboardingDev = pathname.startsWith("/onboarding/dev");
  const showChrome = !(isAdmin || (isOnboarding && !isOnboardingDev));

  return (
    <html lang="es" className="h-full antialiased scroll-smooth">
      <body
        className={`${inter.className} bg-gray-50 text-slate-900 min-h-full flex flex-col`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17932575934"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17932575934');
          `}
        </Script>
        {showChrome ? <Header /> : null}
        {children}
        {showChrome ? <Footer /> : null}
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "TuEjecutiva.cl",
              url: "https://tuejecutiva.cl",
              description:
                "Plataforma independiente de verificación y contacto entre usuarios y ejecutivas de distintas áreas en Chile.",
              publisher: {
                "@type": "Organization",
                name: "TuEjecutiva.cl",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
