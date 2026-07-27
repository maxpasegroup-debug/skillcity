import { Award, CreditCard, Target, TrendingUp, Trophy, Users, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getBdmDashboard, requireBdmUser } from "@/server/admissions/queries";

export default async function BdmDashboardPage() {
  const user = await requireBdmUser();
  const dashboard = await getBdmDashboard(user.id);
  const wonLeads = dashboard.assignedLeads.filter((lead) => lead.status === "WON").length;
  const approvedCommission = dashboard.commissions.filter((item) => item.status === "APPROVED" || item.status === "PAID").reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Business Development" title={`Welcome, ${user.name}`} description="Your assigned leads, conversions, revenue, commission, and referral work in one calm view." />
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Assigned Leads" value={dashboard.assignedLeads.length} icon={Users} />
        <DirectorMetricCard label="Conversions" value={wonLeads} icon={TrendingUp} />
        <DirectorMetricCard label="Monthly Revenue" value={`INR ${dashboard.monthlyRevenue}`} icon={CreditCard} />
        <DirectorMetricCard label="Commission" value={`INR ${approvedCommission}`} icon={Award} />
        <DirectorMetricCard label="Referrals" value={dashboard.referrals.length} icon={Target} />
        <DirectorMetricCard label="Wallet" value={`INR ${approvedCommission}`} icon={Wallet} />
        <DirectorMetricCard label="Leaderboard Rank" value={dashboard.leaderboard.findIndex((item) => item.userId === user.id) + 1 || "-"} icon={Trophy} />
        <DirectorMetricCard label="Target Progress" value={`${wonLeads}/20`} icon={Target} />
      </section>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-black text-brand-dark">Priority Leads</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {dashboard.assignedLeads.slice(0, 6).map((lead) => (
              <div key={lead.id} className="rounded-lg bg-white p-4">
                <p className="font-black text-brand-dark">{lead.name}</p>
                <p className="mt-1 text-sm font-bold text-brand-muted">{lead.pipelineStage.name} - {lead.priority}</p>
                <p className="mt-1 text-sm font-bold text-brand-muted">{lead.programInterested?.name ?? "Program pending"}</p>
              </div>
            ))}
            {dashboard.assignedLeads.length === 0 ? <p className="font-semibold text-brand-muted">No assigned leads yet.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
