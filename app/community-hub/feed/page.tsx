import { Card, CardContent } from "@/components/ui/card";
import { PostForm } from "@/features/community/components/community-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCommunityData, requireCommunityUser } from "@/server/community/queries";

export default async function CommunityFeedPage() {
  const user = await requireCommunityUser();
  const data = await getCommunityData(user.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Community Hub" title="Community feed" description="Share updates, project milestones, achievements, questions and resources with the Skill City community." /><Card><CardContent className="p-6"><PostForm groups={data.groups} /></CardContent></Card><div className="space-y-5">{data.posts.map((post) => <Card key={post.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{post.type} - {post.group?.name ?? "Community"}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{post.title}</h2><p className="mt-1 font-bold text-brand-muted">{post.author.name}</p><p className="mt-4 leading-7 text-brand-muted">{post.content}</p><p className="mt-4 text-sm font-bold text-brand-muted">{post.reactions.length} reactions - {post.comments.length} comments</p></CardContent></Card>)}</div></div>;
}
