import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  if (process.env.DINING_FEATURE_ENABLED !== "true") notFound();
  const { token } = await params;
  return <DiningQrExperience token={token} />;
}
