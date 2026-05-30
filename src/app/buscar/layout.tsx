import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar productos",
  description: "Encuentra el producto perfecto en Switch&Tech. Busca por nombre, categoría o descripción.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function BuscarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
