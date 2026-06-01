import type { Metadata } from "next";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "Menfi's Burger",
  description: "Cardapio digital Menfi's Burger",
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
