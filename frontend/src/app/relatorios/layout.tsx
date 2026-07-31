import { internalMetadata } from "@/config/internalMetadata";

export const metadata = internalMetadata("Relatórios");

export default function ReportsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
