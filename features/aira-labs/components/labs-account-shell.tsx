import Link from "next/link";
import { FlaskConical } from "lucide-react";

export function LabsAccountShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f4f6f3] px-5 py-8 text-[#111814] sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <Link href="/aira-labs" className="inline-flex items-center gap-3 font-black"><span className="grid h-11 w-11 place-items-center rounded-lg bg-[#e52b2f] text-white"><FlaskConical className="h-6 w-6" /></span>AIRA LABS</Link>
        <section className="mt-9 rounded-lg border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(17,24,20,0.08)] sm:p-8">
          <h1 className="text-3xl font-black">{title}</h1><p className="mt-3 font-semibold leading-7 text-[#526059]">{subtitle}</p><div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
