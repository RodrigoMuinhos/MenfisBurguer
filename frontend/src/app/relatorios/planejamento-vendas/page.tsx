"use client";

import { useEffect, useState } from "react";
import App from "../../App";

export default function SalesPlanningPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    localStorage.setItem("menfis_admin_tab", "resultados");
    setReady(true);
  }, []);
  return ready ? <App mode="admin" /> : null;
}
