import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  let productPages: MetadataRoute.Sitemap = [];

  try {
    const products = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    productPages = products.map((product) => ({
      url: `${baseUrl}/shop/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Database may be unavailable during build; static routes still publish.
  }

  return [...staticPages, ...productPages];
}
