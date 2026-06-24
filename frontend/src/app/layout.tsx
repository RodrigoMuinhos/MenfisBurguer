import type { Metadata } from "next";
import type { Viewport } from "next";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "Menfi's Burger",
  description: "Cardapio digital Menfi's Burger",
  icons: {
    icon: [
      {
        url: "/logo_M.jpeg?v=20260623",
        sizes: "180x180",
        type: "image/jpeg",
      },
    ],
    apple: [
      {
        url: "/logo_M.jpeg?v=20260623",
        sizes: "180x180",
        type: "image/jpeg",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Menfi´sBurguer",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
