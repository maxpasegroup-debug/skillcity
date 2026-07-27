import { CalendarDays } from "lucide-react";
import { StudentEmptyPage } from "@/features/journey/components/student-empty-page";

export default function CalendarPage() {
  return (
    <StudentEmptyPage
      eyebrow="Calendar"
      title="Your learning calendar"
      message="Live classes, meetings, and important journey dates will appear here when they are scheduled for your batch."
      icon={CalendarDays}
    />
  );
}
