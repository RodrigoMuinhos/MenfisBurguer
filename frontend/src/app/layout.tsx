import type { Metadata } from "next";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "Menfi's Burger",
  description: "Cardapio digital Menfi's Burger",
  icons: {
    icon: [
      {
        url: "/logo_M_square.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/logo_M_square.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Menfi's Burger",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
