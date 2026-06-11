import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalizados",
  description:
    "Crea algo único. Personaliza fundas, termos y packs con tu propio diseño. El mejor regalo corporativo o detalle especial.",
  openGraph: {
    title: "Personalizados | Switch&Tech",
    description: "Crea fundas, termos y packs con tu propio diseño.",
  },
  alternates: { canonical: "/personalizados" },
};

export default function PersonalizadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
