import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Menfi's Burger",
    short_name: "Menfi's",
    description: "Cardápio digital Menfi's Burger",
    start_url: "/",
    display: "standalone",
    background_color: "#F2E5D5",
    theme_color: "#1F3D2E",
    icons: [
      {
        src: "/logo_M.jpeg",
        sizes: "180x180",
        type: "image/jpeg",
      },
    ],
  };
}
