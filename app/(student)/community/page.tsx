import { Users } from "lucide-react";
import { StudentEmptyPage } from "@/features/journey/components/student-empty-page";

export default function CommunityPage() {
  return (
    <StudentEmptyPage
      eyebrow="Community"
      title="Your SkillCity community"
      message="Batch discussions and community spaces will appear here when your program community is enabled."
      icon={Users}
    />
  );
}
