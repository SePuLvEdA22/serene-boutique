import type { MetadataRoute } from "next";
import { getProductRepo } from '@/lib/repositories';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://switchandtech.com";

  const products = (await getProductRepo().findAll()).filter(p => p.active !== false);

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/producto/${product.id}`,
    lastModified: new Date(product.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/fundas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/cargadores`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/termos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/personalizados`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/envios`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/devoluciones`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    ...productUrls,
  ];
}
