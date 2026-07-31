import { NextResponse } from "next/server";

export const POST = () =>
  NextResponse.json(
    {
      error: "legacy_customer_api_retired",
      message: "Use the backend customer API.",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    },
  );
