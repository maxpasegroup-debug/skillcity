import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DirectorMetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="flex min-h-32 items-center gap-5 p-6">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-brand-muted">{label}</p>
          <p className="mt-2 text-2xl font-black text-brand-dark">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
