import type { MetadataRoute } from "next";
import { BUSINESS } from "@/config/business";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: BUSINESS.name,
    short_name: "Menfi’s",
    description: BUSINESS.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFE9EC",
    theme_color: "#65001F",
    lang: BUSINESS.language,
    categories: ["food", "shopping"],
    icons: [
      {
        src: "/logo_M.jpeg?v=20260623",
        sizes: "180x180",
        type: "image/jpeg",
      },
    ],
  };
}
