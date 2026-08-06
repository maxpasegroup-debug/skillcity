import Link from "next/link";
import { CheckCircle2, CreditCard, FileText, GraduationCap, MessageSquare, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdminCommandCenter } from "@/server/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminAdmissionCellPage() {
  const data = await getAdminCommandCenter();
  const cells = [
    { title: "Applications", href: "/admissions/applications", detail: "Create and manage applicant records.", value: data.stats.totalApplications, icon: FileText },
    { title: "Review", href: "/admissions/review", detail: "Approve or reject submitted applications.", value: data.admissions.stats.pendingReview, icon: CheckCircle2 },
    { title: "Admissions", href: "/admissions/approved", detail: "Generate WhatsApp login access for approved students.", value: data.admissions.stats.approvedApplications, icon: GraduationCap },
    { title: "Fee", href: "/admissions/payments", detail: "Track invoices, seat booking and payment confirmation.", value: data.admissions.stats.pendingPayments, icon: CreditCard },
    { title: "Counselling", href: "/admissions/counselling", detail: "Schedule sessions and follow-ups.", value: data.admissions.stats.upcomingCounselling, icon: Users },
    { title: "Communications", href: "/admissions/communications", detail: "View admission messages and manual communication logs.", value: data.whatsappMessages.length, icon: MessageSquare }
  ];

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admin" title="Admission Cell" description="A simple department view for the September 5 launch path from application to activated student dashboard." />
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cells.map((cell) => (
          <Link key={cell.href} href={cell.href}>
            <Card className="h-full transition hover:-translate-y-1 hover:shadow-soft">
              <CardContent className="p-6">
                <cell.icon className="h-8 w-8 text-brand-red" />
                <p className="mt-6 text-sm font-black uppercase tracking-wide text-brand-red">{cell.value} active</p>
                <h2 className="mt-2 text-2xl font-black text-brand-dark">{cell.title}</h2>
                <p className="mt-3 font-semibold leading-7 text-brand-muted">{cell.detail}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
