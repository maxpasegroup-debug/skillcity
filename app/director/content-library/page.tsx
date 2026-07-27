import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContentLibraryForm } from "@/features/director/components/director-forms";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorContentLibrary } from "@/server/director/queries";

export default async function DirectorContentLibraryPage() {
  const [items, programs] = await getDirectorContentLibrary();

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Content Library" title="Reusable content library" description="Store reusable videos, PDFs, articles, voice notes, and external links once, then attach them to journey days." />
      <Card><CardContent className="p-6 md:p-8"><ContentLibraryForm programs={programs} /></CardContent></Card>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-brand-dark">Library Items</h2>
        {items.length === 0 ? <DirectorEmptyState icon={FileText} message="No reusable content has been added yet." /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{item.type.replaceAll("_", " ")}</p><h3 className="mt-2 text-2xl font-black text-brand-dark">{item.title}</h3><p className="mt-2 text-sm font-bold text-brand-muted">{item.program?.name ?? "Shared library"}</p></CardContent></Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
