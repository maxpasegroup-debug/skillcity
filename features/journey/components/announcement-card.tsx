import { Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Announcement = {
  id: string;
  title: string;
  message: string;
  publishedAt: Date | null;
};

export function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-base font-semibold text-brand-muted">No announcements right now.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
          <CardContent className="flex gap-4 p-6">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-brand-dark">{announcement.title}</h3>
              <p className="mt-2 text-base leading-7 text-brand-muted">{announcement.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
