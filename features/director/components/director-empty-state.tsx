import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DirectorEmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <Card>
      <CardContent className="flex gap-5 p-8">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
          <Icon className="h-6 w-6" />
        </div>
        <p className="max-w-3xl text-lg leading-8 text-brand-muted">{message}</p>
      </CardContent>
    </Card>
  );
}
