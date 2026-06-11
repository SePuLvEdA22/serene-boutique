import type { Metadata } from "next";
import { getProductById } from "@/lib/products";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} | Switch&Tech`,
      description: product.description,
    },
    alternates: { canonical: `/producto/${id}` },
  };
}

export default function ProductoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
