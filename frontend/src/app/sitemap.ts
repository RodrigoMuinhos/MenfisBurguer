import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/business";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/menfisbuffet"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/politica-de-privacidade"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/termos-de-servico"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/exclusao-de-dados"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
