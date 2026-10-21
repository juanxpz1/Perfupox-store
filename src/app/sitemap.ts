import type { MetadataRoute } from "next";
import { allProductSlugs } from "@/modules/catalog/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const products = await allProductSlugs();
  const lines = ["arabe", "disenador", "preparada"].map((l) => ({ url: `${base}/tienda?linea=${l}`, changeFrequency: "daily" as const, priority: 0.8 }));
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/tienda`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/tienda?formato=decant`, changeFrequency: "daily", priority: 0.8 },
    ...lines,
    ...products.map((p) => ({ url: `${base}/perfume/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
