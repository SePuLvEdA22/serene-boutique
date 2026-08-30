import HeroSection from '@/components/HeroSection';
import CategorySection from '@/components/CategorySection';
import ProductGrid from '@/components/ProductGrid';
import NewsletterSection from '@/components/NewsletterSection';
import { getFeaturedProducts } from '@/lib/products';

// Tienda dinámica: los productos se crean en runtime (Neon), no en build.
// Sin esto Next prerenderiza con DB vacía y Vercel sirve CDN stale.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="container-store">
      <HeroSection />
      <CategorySection />
      <ProductGrid products={featured} title="Productos Destacados" />
      <NewsletterSection />
    </div>
  );
}
