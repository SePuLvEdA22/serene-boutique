import type { Metadata } from "next";
import ProductFilters from "@/components/ProductFilters";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getProductsByCategory } from "@/lib/products";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Termos",
  description:
    "Mantén tus bebidas a la temperatura ideal con nuestros termos. Acero inoxidable, diseño elegante y resistencia superior.",
  openGraph: {
    title: "Termos | Switch&Tech",
    description:
      "Mantén tus bebidas a la temperatura ideal con nuestros termos. Acero inoxidable y diseño elegante.",
  },
  alternates: { canonical: "/termos" },
};

export default async function TermosPage() {
  const products = await getProductsByCategory("termos");

  return (
    <div className="container-store py-12 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Termos' }]} />
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Termos</h1>
        <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-on-surface-variant">
          Lleva tu esencia a donde vayas. Termos que mantienen la temperatura y reflejan tu estilo.
        </p>
      </div>
      <ProductFilters products={products} />
    </div>
  );
}
