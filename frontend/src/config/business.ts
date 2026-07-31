export const BUSINESS = {
  name: "Menfi’s Burguer",
  legalDisplayName: "Menfi’s Burguer",
  description:
    "Cardápio digital da Menfi’s Burguer para pedidos de delivery e retirada em Fortaleza, Ceará.",
  url: "https://www.menfisburguer.com.br",
  locale: "pt_BR",
  language: "pt-BR",
  city: "Fortaleza",
  state: "CE",
  country: "BR",
  areaServed: "Fortaleza, Ceará",
  phoneDisplay: "(85) 99788-3764",
  phoneInternational: "+5585997883764",
  whatsappUrl: "https://wa.me/5585997883764",
  logo: "/logo_M.jpeg",
  socialImage: {
    url: "/logo_M.jpeg",
    width: 1254,
    height: 1254,
    alt: "Marca Menfi’s Burguer",
  },
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, BUSINESS.url).toString();
}
