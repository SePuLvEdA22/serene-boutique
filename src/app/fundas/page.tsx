import type { Metadata } from "next";
import ProductFilters from "@/components/ProductFilters";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Fundas",
  description:
    "Protege tu dispositivo con estilo. Descubre nuestra colección de fundas para iPhone y Android con diseños exclusivos, silicona, piel y más.",
  openGraph: {
    title: "Fundas | Switch&Tech",
    description:
      "Protege tu dispositivo con estilo. Colección de fundas con diseños exclusivos.",
  },
  alternates: { canonical: "/fundas" },
};

export default function FundasPage() {
  const products = getProductsByCategory("fundas");

  return (
    <div className="container-store py-12 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Fundas' }]} />
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Fundas</h1>
        <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-on-surface-variant">
          Protege tu dispositivo con estilo. Descubre nuestra colección de fundas diseñadas para cada personalidad.
        </p>
      </div>
      <ProductFilters products={products} />
    </div>
  );
}
