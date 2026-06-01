import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://matecata.franciscocucullu.com"),
  title: "MateCata",
  description: "Aprende las tablas de multiplicar jugando con MateCata",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MateCata",
  },
  openGraph: {
    type: "website",
    url: "https://matecata.franciscocucullu.com",
    siteName: "MateCata",
    title: "MateCata",
    description: "Aprende las tablas de multiplicar jugando con MateCata",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MateCata",
    description:
      "Aprendé las tablas de multiplicar jugando, con gatitos, confetti y trofeos.",
    images: ["/og-image.jpg"],
  },
  other: { google: "notranslate" },
};

export const viewport: Viewport = {
  themeColor: "#F97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" translate="no" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
