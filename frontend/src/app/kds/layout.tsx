import { internalMetadata } from "@/config/internalMetadata";

export const metadata = internalMetadata("Cozinha");

export default function KdsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
