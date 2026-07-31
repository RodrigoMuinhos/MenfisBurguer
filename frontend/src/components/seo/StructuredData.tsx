import { BUSINESS, absoluteUrl } from "@/config/business";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BUSINESS.url}/#organization`,
      name: BUSINESS.name,
      url: BUSINESS.url,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(BUSINESS.logo),
        width: 1254,
        height: 1254,
      },
      description: BUSINESS.description,
      telephone: BUSINESS.phoneInternational,
      areaServed: {
        "@type": "AdministrativeArea",
        name: BUSINESS.areaServed,
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: BUSINESS.phoneInternational,
        availableLanguage: "Portuguese",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${BUSINESS.url}/#website`,
      url: BUSINESS.url,
      name: BUSINESS.name,
      description: BUSINESS.description,
      inLanguage: BUSINESS.language,
      publisher: {
        "@id": `${BUSINESS.url}/#organization`,
      },
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}
