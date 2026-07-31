import { NextResponse } from "next/server";

export const PATCH = () =>
  NextResponse.json(
    {
      error: "legacy_orders_api_retired",
      message: "Use the backend order API.",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    },
  );
