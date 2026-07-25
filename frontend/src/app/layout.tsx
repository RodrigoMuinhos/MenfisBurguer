import type { Metadata } from "next";
import type { Viewport } from "next";
import Script from "next/script";
import "../styles/index.css";
import { MetaPixel } from "@/components/analytics/MetaPixel";

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
      <head>
        <Script
          id="meta-pixel-base"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `if(!['/adm','/kds','/notas','/entrega','/relatorios'].some(function(route){return location.pathname===route||location.pathname.indexOf(route+'/')===0;})){!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1451662243464965');fbq('track','PageView');window.__menfisMetaLastPath=location.pathname;}`,
          }}
        />
      </head>
      <body>
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
