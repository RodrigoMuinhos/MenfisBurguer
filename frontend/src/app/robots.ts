import type { MetadataRoute } from "next";
import { BUSINESS, absoluteUrl } from "@/config/business";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/adm",
        "/kds",
        "/notas",
        "/entrega",
        "/relatorios",
        "/api",
        "/backend",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: BUSINESS.url,
  };
}
