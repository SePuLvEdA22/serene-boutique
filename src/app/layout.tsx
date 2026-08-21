import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "@/context/ThemeContext";

const CartDrawer = dynamic(() => import("@/components/CartDrawer"));

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://switchandtech.com"),
  title: {
    default: "Switch&Tech — Accesorios elegantes",
    template: "%s | Switch&Tech",
  },
  description:
    "Descubre nuestra colección de fundas, cargadores, termos y accesorios personalizados. Calidad y diseño que inspiran.",
  keywords: ["fundas", "cargadores", "termos", "accesorios", "personalizados", "tecnología", "Switch&Tech"],
  authors: [{ name: "Switch&Tech" }],
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Switch&Tech",
    title: "Switch&Tech — Accesorios elegantes",
    description:
      "Descubre nuestra colección de fundas, cargadores, termos y accesorios personalizados. Calidad y diseño que inspiran.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Switch&Tech — Accesorios elegantes",
    description:
      "Descubre nuestra colección de fundas, cargadores, termos y accesorios personalizados.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://switchandtech.com",
  },
};

export const viewport: Viewport = {
  themeColor: "#725856",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${playfairDisplay.variable} ${dmSans.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-surface font-body text-on-surface antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary focus:outline-none"
        >
          Saltar al contenido principal
        </a>
        <AuthProvider>
          <ThemeProvider>
          <CartProvider>
            <ToastProvider>
              <SiteShell>
                {children}
              </SiteShell>
              <CartDrawer />
            </ToastProvider>
          </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
