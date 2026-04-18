import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productsApi } from "@/lib/api/products";
import { ProductDetailClient } from "./product-detail-client";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await productsApi.getBySlug(params.slug);
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
    const product = await productsApi.getBySlug(params.slug);

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

    return (
      <>
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
