import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://specialists.aibry.shop/", lastModified: new Date("2026-07-14T00:00:00.000Z"), changeFrequency: "monthly", priority: 1 }];
}
