import { Settings } from "lucide-react";
import { StudentEmptyPage } from "@/features/journey/components/student-empty-page";

export default function SettingsPage() {
  return (
    <StudentEmptyPage
      eyebrow="Settings"
      title="Account settings"
      message="Profile preferences and notification settings will appear here when account management controls are enabled."
      icon={Settings}
    />
  );
}
