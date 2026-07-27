import { Presentation } from "lucide-react";
import { StudentEmptyPage } from "@/features/journey/components/student-empty-page";

export default function ProjectsPage() {
  return (
    <StudentEmptyPage
      eyebrow="Projects"
      title="Your project work"
      message="Projects connected to your current journey will appear here when your program team assigns them."
      icon={Presentation}
    />
  );
}
