import { Card, CardContent } from "@/components/ui/card";
import { AutomationRuleForm } from "@/features/executive/components/executive-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveData } from "@/server/executive/queries";

export default async function AutomationCenterPage() {
  const [, , , , rules] = await getExecutiveData();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Automation Center" title="Event-driven operating rules" description="Create extensible automations for absences, reviews, fees, certificates and challenge rewards." /><Card><CardContent className="p-6"><AutomationRuleForm /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{rules.map((rule) => <Card key={rule.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{rule.triggerType} to {rule.actionType}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{rule.name}</h2><p className="mt-2 font-bold text-brand-muted">{rule.active ? "Active" : "Inactive"} - {rule.executions.length} recent executions</p></CardContent></Card>)}</div></div>;
}
