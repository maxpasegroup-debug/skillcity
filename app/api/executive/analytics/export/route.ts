import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getExecutiveIntelligence } from "@/server/analytics/queries";
import { executiveMetricsCsv } from "@/server/analytics/export";
import { getCurrentUser } from "@/server/auth/session";

export async function GET(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(actor, PERMISSIONS.EXECUTIVE_ACCESS)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const period = new URL(request.url).searchParams.get("period") ?? undefined;
  const data = await getExecutiveIntelligence(period);
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "EXECUTIVE_ANALYTICS_EXPORTED", entity: "ExecutiveAnalytics", metadata: { period: data.range.period, timeZone: data.range.timeZone, aggregateOnly: true } } });
  return new Response(executiveMetricsCsv(data), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="aira-executive-${data.range.period.toLowerCase()}.csv"`, "Cache-Control": "private, no-store" } });
}
