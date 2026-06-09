import { redirect } from "next/navigation";
import App from "./App";

export default function Page() {
  if (process.env.NEXT_PUBLIC_ORDER_RUNTIME_MODE === "delivery") {
    return <App mode="delivery" />;
  }
  redirect("/kiosk");
}
