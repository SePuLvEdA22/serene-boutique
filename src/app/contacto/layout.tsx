import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Estamos aquí para ayudarte. Contáctanos por email, teléfono o redes sociales. Te responderemos a la brevedad.",
  openGraph: {
    title: "Contacto | Switch&Tech",
    description: "Contáctanos. Estamos aquí para ayudarte.",
  },
  alternates: { canonical: "/contacto" },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
