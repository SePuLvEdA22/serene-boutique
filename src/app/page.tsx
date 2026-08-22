import HeroSection from '@/components/HeroSection';
import CategorySection from '@/components/CategorySection';
import ProductGrid from '@/components/ProductGrid';
import NewsletterSection from '@/components/NewsletterSection';
import { getFeaturedProducts } from '@/lib/products';

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
