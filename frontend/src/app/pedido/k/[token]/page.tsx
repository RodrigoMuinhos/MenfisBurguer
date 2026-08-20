import type { Metadata } from "next";
import { DiningQrExperience } from "./DiningQrExperience";

export const metadata: Metadata = {
  title: "Pedido na mesa | Menfi’s Burger",
  description: "Faça seu pedido pelo QR Code da mesa Menfi’s.",
  robots: { index: false, follow: false },
};

export default async function DiningQrPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <DiningQrExperience token={token} />;
}
