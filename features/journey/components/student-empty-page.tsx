import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StudentEmptyPage({
  eyebrow,
  title,
  message,
  icon: Icon
}: {
  eyebrow: string;
  title: string;
  message: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-lg font-bold text-brand-red">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black text-brand-dark md:text-5xl">{title}</h1>
      </section>
      <Card>
        <CardContent className="flex flex-col gap-5 p-8 md:flex-row md:items-center md:p-10">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
            <Icon className="h-7 w-7" />
          </div>
          <p className="max-w-3xl text-lg leading-8 text-brand-muted">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
