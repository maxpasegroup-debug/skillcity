import Link from "next/link";
import { BriefcaseBusiness, FileText, Share2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCareerHubDashboard } from "@/server/career-hub/queries";

export default async function CareerHubPage() {
  const data = await getCareerHubDashboard();
  const items = [
    { label: "Visible Opportunities", value: data.visibleCount, icon: BriefcaseBusiness, href: "/career/opportunities" },
    { label: "My Applications", value: data.applications, icon: FileText, href: "/career/applications" },
    { label: "Active Referrals", value: data.referrals, icon: Share2, href: "/career/referrals" },
    { label: "Career Profile", value: data.profile ? "Ready" : "Set up", icon: UserRound, href: "/career/profile" }
  ];
  return <div className="space-y-10"><header><p className="text-sm font-black uppercase text-brand-red">AIRA Career Hub / Nice Jobs</p><h1 className="mt-3 text-4xl font-black text-brand-dark">Opportunity workspace</h1><p className="mt-3 max-w-3xl font-semibold leading-7 text-brand-muted">Connect verified learning evidence and a private career profile to legitimate work opportunities without duplicating your AIRA identity.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link href="/career/opportunities">Browse Opportunities</Link></Button><Button asChild variant="secondary"><Link href="/career/profile">Manage Profile</Link></Button>{data.canManage ? <Button asChild variant="secondary"><Link href="/career/manage">Manage Career Hub</Link></Button> : null}</div></header><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <Link key={item.label} href={item.href}><Card><CardContent className="flex min-h-36 items-center gap-4 p-5"><item.icon className="h-7 w-7 text-brand-red" /><div><p className="font-bold text-brand-muted">{item.label}</p><p className="mt-2 text-3xl font-black text-brand-dark">{item.value}</p></div></CardContent></Card></Link>)}</section><Card><CardContent className="p-6"><h2 className="text-xl font-black text-brand-dark">Privacy by default</h2><p className="mt-2 font-semibold leading-7 text-brand-muted">Employers see only the career presentation attached to an application. Academic notes, CRM records, finances, private documents, contact details, and unrelated applications remain internal.</p></CardContent></Card></div>;
}
