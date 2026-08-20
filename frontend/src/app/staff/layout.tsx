import type { Metadata } from "next";

export const metadata: Metadata = { title: "Menfi's Staff" };

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return children;
}
