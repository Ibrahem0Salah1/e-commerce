import type { MetadataRoute } from "next";
import prisma from "@/lib/config/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://mds-woad.vercel.app";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/auth/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/auth/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/cart`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, archived: false },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/shop/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch {
    // DB unavailable at build (e.g., preview) — fall back to static only
    return staticRoutes;
  }
}
