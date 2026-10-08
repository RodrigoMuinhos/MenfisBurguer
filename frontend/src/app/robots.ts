import type { MetadataRoute } from "next";
import { BUSINESS, absoluteUrl } from "@/config/business";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Rotas internas usam metadados noindex e autorização real no backend.
      // Não anunciar sua estrutura aqui: robots.txt não é controle de acesso.
      disallow: [],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: BUSINESS.url,
  };
}
