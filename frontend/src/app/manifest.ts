import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Menfi's Burger",
    short_name: "Menfi's",
    description: "Cardápio digital Menfi's Burger",
    start_url: "/",
    display: "standalone",
    background_color: "#FFE9EC",
    theme_color: "#65001F",
    icons: [
      {
        src: "/logo_M.jpeg?v=20260623",
        sizes: "180x180",
        type: "image/jpeg",
      },
    ],
  };
}
