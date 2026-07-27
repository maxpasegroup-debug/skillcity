import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ReviewAiPanel({ focus }: { focus: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 text-brand-red"><Bot className="h-5 w-5" /><p className="font-black">Tara review support</p></div>
        <p className="mt-3 leading-7 text-brand-muted">
          Tara can summarize {focus}, suggest feedback, detect missing requirements, flag plagiarism risk patterns, and generate encouragement. Trainer approval is always final.
        </p>
        <Button asChild className="mt-5"><a href="/trainer/tara">Open Tara</a></Button>
      </CardContent>
    </Card>
  );
}
