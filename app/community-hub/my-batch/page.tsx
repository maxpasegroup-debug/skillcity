import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCommunityData, requireCommunityUser } from "@/server/community/queries";

export default async function MyBatchPage() {
  const user = await requireCommunityUser();
  const data = await getCommunityData(user.id);
  const batchPosts = data.posts.filter((post) => post.batchId === data.enrollment?.batchId);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="My Batch" title={data.enrollment?.batch?.name ?? "Batch community"} description="Your batch conversations, milestones and announcements stay together." /><div className="space-y-5">{batchPosts.map((post) => <Card key={post.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{post.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{post.title}</h2><p className="mt-3 leading-7 text-brand-muted">{post.content}</p></CardContent></Card>)}{batchPosts.length === 0 ? <p className="font-semibold text-brand-muted">No batch posts yet.</p> : null}</div></div>;
}
