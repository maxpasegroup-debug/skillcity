import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";

const settings = [
  "Director roles are assigned through admin-controlled user roles.",
  "Program schedules are controlled by journeys, blueprints, batches, calendar events, and day activities.",
  "Student-facing announcements are published through the Communication Hub.",
  "Tara Director Assistant integration is reserved for Phase 5."
];

export default function DirectorSettingsPage() {
  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Settings" title="Command Center settings" description="Operational settings that govern how the Director Command Center behaves." />
      <div className="grid gap-5 lg:grid-cols-2">
        {settings.map((item) => (
          <Card key={item}>
            <CardContent className="flex gap-4 p-6">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red"><Settings className="h-5 w-5" /></div>
              <p className="text-base font-bold leading-7 text-brand-muted">{item}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
