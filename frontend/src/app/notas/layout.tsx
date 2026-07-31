import { internalMetadata } from "@/config/internalMetadata";

export const metadata = internalMetadata("Notas da cozinha");

export default function NotesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
