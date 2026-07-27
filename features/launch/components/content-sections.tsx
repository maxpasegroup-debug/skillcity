import { BadgeCheck, Building2, HelpCircle, Images, Megaphone, Quote, Trophy, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { socialProof } from "@/features/launch/content";

export function FAQSection({ items }: { items: string[] }) {
  const pairs = Array.from({ length: Math.ceil(items.length / 2) }, (_, index) => items.slice(index * 2, index * 2 + 2));
  return <ContentBand title="FAQ" icon={HelpCircle}>{pairs.map(([q, a]) => <Card key={q}><CardContent className="p-6"><h3 className="text-xl font-black text-brand-dark">{q}</h3><p className="mt-3 leading-7 text-brand-muted">{a}</p></CardContent></Card>)}</ContentBand>;
}

export function SocialProofSections() {
  return (
    <div className="space-y-10">
      <ContentBand title="Student Testimonials" icon={Quote}>{socialProof.testimonials.map((item) => <MiniCard key={item} title={item} />)}</ContentBand>
      <ContentBand title="Faculty" icon={Users}>{socialProof.faculty.map((item) => <MiniCard key={item} title={item} />)}</ContentBand>
      <ContentBand title="Career Outcomes" icon={Trophy}>{socialProof.outcomes.map((item) => <MiniCard key={item} title={item} />)}</ContentBand>
      <ContentBand title="Placement Partners" icon={Building2}>{socialProof.partners.map((item) => <MiniCard key={item} title={item} />)}</ContentBand>
      <ContentBand title="Gallery" icon={Images}>{["Campus moments will appear here after launch.", "Project demos will be added from student milestones."].map((item) => <MiniCard key={item} title={item} />)}</ContentBand>
      <ContentBand title="Announcements" icon={Megaphone}>{["September 5 first batch admissions are open."].map((item) => <MiniCard key={item} title={item} />)}</ContentBand>
      <ContentBand title="Success Stories" icon={BadgeCheck}>{socialProof.successStories.map((item) => <MiniCard key={item} title={item} />)}</ContentBand>
    </div>
  );
}

function ContentBand({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return <section><div className="mb-5 flex items-center gap-3"><Icon className="h-6 w-6 text-brand-red" /><h2 className="text-3xl font-black text-brand-dark">{title}</h2></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{children}</div></section>;
}

function MiniCard({ title }: { title: string }) {
  return <Card><CardContent className="min-h-28 p-5"><p className="font-bold leading-7 text-brand-muted">{title}</p></CardContent></Card>;
}
