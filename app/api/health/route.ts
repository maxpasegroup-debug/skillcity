import { NextResponse } from "next/server";
import { checkApplicationReadiness } from "@/server/health/readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const ready = await checkApplicationReadiness();
    return NextResponse.json({ status: ready ? "ready" : "unavailable" }, {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json({ status: "unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
