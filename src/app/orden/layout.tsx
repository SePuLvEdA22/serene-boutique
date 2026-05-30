import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orden confirmada",
  description: "Tu pedido ha sido confirmado exitosamente.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
