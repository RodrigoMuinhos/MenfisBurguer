import { internalMetadata } from "@/config/internalMetadata";

export const metadata = internalMetadata("Área de entrega");

export default function DeliveryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
