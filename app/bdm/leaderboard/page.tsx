import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { prisma } from "@/lib/prisma";
import { requireBdmUser } from "@/server/admissions/queries";

export default async function BdmLeaderboardPage() {
  await requireBdmUser();
  const rows = await prisma.commissionRecord.groupBy({ by: ["userId"], _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } }, take: 20 });
  const users = await prisma.user.findMany({ where: { id: { in: rows.map((row) => row.userId) } }, select: { id: true, name: true } });

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Leaderboard" title="BDM performance" description="Rankings are based on approved and pending commission value." />
      <div className="space-y-4">
        {rows.map((row, index) => (
          <Card key={row.userId}>
            <CardContent className="flex items-center justify-between p-6">
              <div><p className="text-sm font-black text-brand-red">Rank {index + 1}</p><h2 className="mt-1 text-2xl font-black text-brand-dark">{users.find((user) => user.id === row.userId)?.name ?? "BDM"}</h2></div>
              <p className="text-xl font-black text-brand-dark">INR {row._sum.amount ?? 0}</p>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 ? <p className="font-semibold text-brand-muted">Leaderboard will appear after commission records are created.</p> : null}
      </div>
    </div>
  );
}
