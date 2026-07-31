import type { Metadata } from "next";
import { BUSINESS, absoluteUrl } from "./business";

export function publicPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: BUSINESS.locale,
      url,
      siteName: BUSINESS.name,
      title,
      description,
      images: [BUSINESS.socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(BUSINESS.socialImage.url)],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
