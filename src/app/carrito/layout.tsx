import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carrito",
  description:
    "Revisa los productos en tu carrito de compras. Finaliza tu pedido cuando estés listo.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CarritoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
