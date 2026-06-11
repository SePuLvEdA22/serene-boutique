import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favoritos",
  description:
    "Tus productos favoritos de Switch&Tech guardados en un solo lugar.",
  robots: { index: false, follow: false },
};

export default function FavoritosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
