import type { Metadata } from "next";
import ProductFilters from "@/components/ProductFilters";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getProductsByCategory } from "@/lib/products";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Cargadores",
  description:
    "Mantén tus dispositivos siempre encendidos. Cargadores rápidos, inalámbricos y power banks con la mejor tecnología.",
  openGraph: {
    title: "Cargadores | Switch&Tech",
    description:
      "Mantén tus dispositivos siempre encendidos. Cargadores rápidos, inalámbricos y power banks.",
  },
  alternates: { canonical: "/cargadores" },
};

export default async function CargadoresPage() {
  const products = await getProductsByCategory("cargadores");

  return (
    <div className="container-store py-12 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Cargadores' }]} />
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Cargadores</h1>
        <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-on-surface-variant">
          Mantén tus dispositivos siempre listos. Carga rápida, inalámbrica y portátil para tu día a día.
        </p>
      </div>
      <ProductFilters products={products} />
    </div>
  );
}
