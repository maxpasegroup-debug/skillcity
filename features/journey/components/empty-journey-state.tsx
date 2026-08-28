import { Card, CardContent } from "@/components/ui/card";

export function EmptyJourneyState() {
  return (
    <Card>
      <CardContent className="p-8 md:p-10">
        <h2 className="text-3xl font-bold text-brand-dark">Your journey is being prepared</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-brand-muted">
          Once the Skill City team enrolls you into a program and batch, Tara AI will show exactly what you need to do today.
        </p>
      </CardContent>
    </Card>
  );
}
