import { NextResponse } from "next/server";

const retired = () =>
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

export const GET = retired;
export const POST = retired;
