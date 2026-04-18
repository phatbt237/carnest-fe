import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dashboard/", "/orders/", "/wallet/", "/checkout/", "/profile/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
