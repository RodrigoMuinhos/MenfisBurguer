import { notFound } from "next/navigation";
import { StaffDiningApp } from "@/components/staff/StaffDiningApp";

export default function StaffPage() {
  if (process.env.DINING_FEATURE_ENABLED !== "true") notFound();
  return <StaffDiningApp />;
}
