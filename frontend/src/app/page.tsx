import App from "./App";
import { publicPageMetadata } from "@/config/metadata";

export const metadata = publicPageMetadata({
  title: "Menfi’s Burguer | Delivery e retirada em Fortaleza",
  description:
    "Veja o cardápio da Menfi’s Burguer e faça seu pedido online para delivery ou retirada em Fortaleza.",
  path: "/",
  absoluteTitle: true,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kiosk?: string; desktop?: string }>;
}) {
  const params = await searchParams;
  const kioskMode = params.kiosk === "1" || params.desktop === "1";
  return <App mode={kioskMode ? "kiosk" : "delivery"} />;
}
