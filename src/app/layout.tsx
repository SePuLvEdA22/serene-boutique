import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "@/context/ThemeContext";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${playfairDisplay.variable} ${dmSans.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-surface font-body text-on-surface antialiased">
        <AuthProvider>
          <ThemeProvider>
          <CartProvider>
            <ToastProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <CartDrawer />
            </ToastProvider>
          </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
