import type { MetadataRoute } from "next";
import { productsApi } from "@/lib/api/products";
import { shopsApi } from "@/lib/api/shops";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/shops`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/auctions`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
  ];

  try {
    const [productsData, shopsData] = await Promise.all([
      productsApi.list({ size: 100 }),
      shopsApi.list({ size: 50 }),
    ]);

    const productRoutes: MetadataRoute.Sitemap = productsData.items.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const shopRoutes: MetadataRoute.Sitemap = shopsData.items.map((s) => ({
      url: `${BASE_URL}/shops/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    }));

    return [...staticRoutes, ...productRoutes, ...shopRoutes];
  } catch {
    return staticRoutes;
  }
}
