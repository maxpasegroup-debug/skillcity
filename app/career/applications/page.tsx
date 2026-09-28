import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WithdrawCareerApplicationForm } from "@/features/career-hub/components/career-hub-forms";
import { getMyCareerApplications } from "@/server/career-hub/queries";

export default async function MyCareerApplicationsPage() {
  const applications = await getMyCareerApplications();
  return <div className="space-y-8"><header><p className="text-sm font-black uppercase text-brand-red">Career Hub</p><h1 className="mt-3 text-4xl font-black text-brand-dark">My Applications</h1></header>{applications.length === 0 ? <Card><CardContent className="flex min-h-40 items-center gap-4 p-6"><FileText className="h-8 w-8 text-brand-red" /><div><p className="font-bold text-brand-muted">You have not applied to an opportunity.</p><Button asChild className="mt-4"><Link href="/career/opportunities">Browse Opportunities</Link></Button></div></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{applications.map((application) => <Card key={application.id}><CardContent className="p-6"><p className="text-xs font-black uppercase text-brand-red">{application.status.replaceAll("_", " ")}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{application.opportunity.title}</h2><p className="mt-1 font-bold text-brand-muted">{application.opportunity.employer.name}</p><p className="mt-3 text-sm font-semibold text-brand-muted">Submitted {application.submittedAt.toLocaleDateString("en-IN")}{application.referral ? ` via ${application.referral.code}` : ""}</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild variant="secondary"><Link href={`/career/opportunities/${application.opportunity.code}`}>View</Link></Button>{["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(application.status) ? <WithdrawCareerApplicationForm applicationId={application.id} /> : null}</div></CardContent></Card>)}</div>}</div>;
}
