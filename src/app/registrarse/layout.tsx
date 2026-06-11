import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Regístrate en Switch&Tech y descubre nuestra colección de accesorios tecnológicos con estilo.",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
