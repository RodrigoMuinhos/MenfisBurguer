import type { Metadata } from "next";
import type { Viewport } from "next";
import Script from "next/script";
import "../styles/index.css";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { StructuredData } from "@/components/seo/StructuredData";
import { BUSINESS, absoluteUrl } from "@/config/business";

const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.url),
  title: {
    default: "Menfi’s Burguer | Delivery e retirada em Fortaleza",
    template: "%s | Menfi’s Burguer",
  },
  description: BUSINESS.description,
  applicationName: BUSINESS.name,
  creator: BUSINESS.name,
  publisher: BUSINESS.name,
  category: "food",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: BUSINESS.locale,
    url: BUSINESS.url,
    siteName: BUSINESS.name,
    title: "Menfi’s Burguer | Delivery e retirada em Fortaleza",
    description: BUSINESS.description,
    images: [BUSINESS.socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Menfi’s Burguer | Delivery e retirada em Fortaleza",
    description: BUSINESS.description,
    images: [absoluteUrl(BUSINESS.socialImage.url)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: googleSiteVerification
    ? { google: googleSiteVerification }
    : undefined,
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
    title: BUSINESS.name,
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#65001F",
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
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if(!['/adm','/kds','/notas','/entrega','/relatorios'].some(function(route){return location.pathname===route||location.pathname.indexOf(route+'/')===0;})){!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1451662243464965');fbq('track','PageView');window.__menfisMetaLastPath=location.pathname;}`,
          }}
        />
      </head>
      <body>
        <StructuredData />
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
