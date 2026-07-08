import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productsApi } from "@/lib/api/products";
import { ProductDetailClient } from "./product-detail-client";

interface Props {
  params: { slug: string };
}

// cache() deduplicates the API call — generateMetadata and the page share one request
const getProduct = cache(productsApi.getBySlug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await getProduct(params.slug);
    return {
      title: product.metaTitle || `${product.name} | CarNest`,
      description:
        product.metaDescription ||
        `Mua ${product.name} - ${product.carBrand} ${product.carModel} scale ${product.scale}. Giá ${product.price.toLocaleString("vi-VN")}đ tại CarNest.`,
      openGraph: {
        title: product.name,
        description:
          product.metaDescription ||
          `${product.carBrand} ${product.carModel} - ${product.scale}`,
        images: product.imageUrls?.[0]
          ? [{ url: product.imageUrls[0], alt: product.name }]
          : [],
        type: "website",
      },
    };
  } catch {
    return { title: "Sản phẩm | CarNest" };
  }
}

export const revalidate = 60;

export default async function ProductDetailPage({ params }: Props) {
  try {
    const product = await getProduct(params.slug);

    // JSON-LD structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.imageUrls,
      brand: { "@type": "Brand", name: product.carBrand },
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "VND",
        availability:
          product.quantity > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition:
          product.condition === "SEALED"
            ? "https://schema.org/NewCondition"
            : "https://schema.org/UsedCondition",
      },
    };

    // Lấy tất cả URL ảnh, ưu tiên images[] (detail response)
    const galleryUrls: string[] = (
      product.images?.map((img) => img.imageUrl) ??
      (product.imageUrls ?? [])
    ).filter(Boolean) as string[];

    // Cloudinary transform giống cdn.main trong gallery
    const preloadUrl = (url: string) =>
      url.includes("res.cloudinary.com")
        ? url.replace("/upload/", "/upload/w_900,q_auto,f_auto/")
        : url;

    return (
      <>
        {/* Preload tất cả ảnh gallery — browser fetch ngay khi nhận HTML */}
        {galleryUrls.map((url) => (
          <link key={url} rel="preload" as="image" href={preloadUrl(url)} />
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ProductDetailClient product={product} />
      </>
    );
  } catch {
    notFound();
  }
}
