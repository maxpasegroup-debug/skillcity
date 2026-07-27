import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";

export default function TrainerSettingsPage() {
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Settings" title="Trainer settings" description="Trainer workspace preferences and notification controls will stay separate from director and finance settings." /><Card><CardContent className="p-6"><p className="font-semibold leading-7 text-brand-muted">Your workspace is scoped to assigned batches, reviews, resources, announcements and Tara trainer support.</p></CardContent></Card></div>;
}
