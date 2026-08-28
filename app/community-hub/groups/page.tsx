import { Card, CardContent } from "@/components/ui/card";
import { GroupForm } from "@/features/community/components/community-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCommunityData, requireCommunityUser } from "@/server/community/queries";

export default async function GroupsPage() {
  const user = await requireCommunityUser();
  const data = await getCommunityData(user.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Groups" title="My groups" description="Batch, program, interest, founder, coding, AI and placement communities." /><Card><CardContent className="p-6"><GroupForm /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{data.groups.map((group) => <Card key={group.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{group.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{group.name}</h2><p className="mt-3 leading-7 text-brand-muted">{group.description ?? "Active Skill City group."}</p><p className="mt-3 text-sm font-bold text-brand-muted">{group.memberships.length} members - {group.posts.length} posts</p></CardContent></Card>)}</div></div>;
}
