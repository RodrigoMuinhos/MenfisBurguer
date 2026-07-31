import { internalMetadata } from "@/config/internalMetadata";

export const metadata = internalMetadata("Administração");

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
