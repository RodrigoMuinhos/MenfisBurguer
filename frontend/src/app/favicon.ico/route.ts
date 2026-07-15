import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/logo_M.jpeg?v=20260623", request.url), 307);
}
