import { Card, CardContent } from "@/components/ui/card";
import { TrainerAnnouncementForm } from "@/features/trainer/components/trainer-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function TrainerAnnouncementsPage() {
  const trainer = await requireTrainer();
  const { batches, announcements } = await getTrainerWorkspaceData(trainer.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Announcements" title="Trainer announcements" description="Send simple class updates, resources, homework and follow-up reminders to assigned batches." /><Card><CardContent className="p-6"><TrainerAnnouncementForm batches={batches} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{announcements.map((announcement) => <Card key={announcement.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{announcement.status}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{announcement.title}</h2><p className="mt-2 font-bold text-brand-muted">{announcement.batch?.name ?? "All batches"}</p><p className="mt-3 leading-7 text-brand-muted">{announcement.message}</p></CardContent></Card>)}</div></div>;
}
