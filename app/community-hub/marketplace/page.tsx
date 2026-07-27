import { Card, CardContent } from "@/components/ui/card";
import { ListingForm } from "@/features/community/components/community-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCommunityData, requireCommunityUser } from "@/server/community/queries";

export default async function MarketplacePage() {
  const user = await requireCommunityUser();
  const data = await getCommunityData(user.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Marketplace" title="Student marketplace" description="Publish templates, projects, prompt packs, design assets, learning resources and services for approval." /><Card><CardContent className="p-6"><ListingForm /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{data.listings.map((listing) => <Card key={listing.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{listing.type} - {listing.priceCoins} coins</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{listing.title}</h2><p className="mt-2 font-bold text-brand-muted">{listing.seller.name} - {listing.category?.name ?? "General"}</p><p className="mt-3 leading-7 text-brand-muted">{listing.description}</p></CardContent></Card>)}</div></div>;
}
