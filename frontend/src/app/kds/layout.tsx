import { internalMetadata } from "@/config/internalMetadata";

export const metadata = internalMetadata("Painel de pedidos");

export default function KdsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
