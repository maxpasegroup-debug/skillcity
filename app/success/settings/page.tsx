import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";

export default function SuccessSettingsPage() {
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Settings" title="Success settings" description="Portfolio visibility and career proof preferences stay separate from learning dashboard settings." /><Card><CardContent className="p-6"><p className="font-semibold leading-7 text-brand-muted">Use Portfolio visibility controls to choose whether your profile is private, public or unlisted.</p></CardContent></Card></div>;
}
