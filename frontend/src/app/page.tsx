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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <App mode={params.kiosk === "1" || params.desktop === "1" ? "kiosk" : "delivery"} />;
}
