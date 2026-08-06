import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AcademyCard({
  title,
  description,
  icon: Icon,
  comingSoon
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-64 flex-col p-6 md:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-beige text-brand-red">
            <Icon className="h-6 w-6" />
          </div>
          {comingSoon ? <span className="rounded-lg bg-white px-3 py-2 text-sm font-black text-brand-muted">Coming Soon</span> : null}
        </div>
        <h3 className="mt-6 text-2xl font-black text-brand-dark">{title}</h3>
        <p className="mt-3 flex-1 text-base leading-7 text-brand-muted">{description}</p>
        <Button asChild className="mt-6 w-full" variant={comingSoon ? "secondary" : "primary"}>
          <Link href={comingSoon ? "/apply" : "#programs"}>{comingSoon ? "Join Waitlist" : "Explore"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
