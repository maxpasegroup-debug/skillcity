import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";

export default function CommunitySettingsPage() {
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Settings" title="Community settings" description="Community moderation, marketplace approval and notification preferences stay separate from learning settings." /><Card><CardContent className="p-6"><p className="font-semibold leading-7 text-brand-muted">Your community activity contributes to XP, Skill Coins, recognition and collaboration.</p></CardContent></Card></div>;
}
