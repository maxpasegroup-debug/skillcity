import { Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CommunicationForm } from "@/features/director/components/director-forms";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorCommunicationData } from "@/server/director/queries";

export default async function DirectorCommunicationsPage() {
  const [announcements, programs, batches] = await getDirectorCommunicationData();

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Communications" title="Communication Hub" description="Create announcements for the platform, programs, batches, or selected student groups." />
      <Card><CardContent className="p-6 md:p-8"><CommunicationForm programs={programs} batches={batches} /></CardContent></Card>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-brand-dark">Director Communications</h2>
        {announcements.length === 0 ? <DirectorEmptyState icon={Megaphone} message="No communications have been created yet. Draft, schedule, or publish the first message above." /> : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{announcement.type.replaceAll("_", " ")} · {announcement.status}</p><h3 className="mt-2 text-2xl font-black text-brand-dark">{announcement.title}</h3><p className="mt-3 text-base leading-7 text-brand-muted">{announcement.message}</p></CardContent></Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
