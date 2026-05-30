import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/carrito", "/api/"],
      },
    ],
    sitemap: "https://switchandtech.com/sitemap.xml",
  };
}
