"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="skillcity-shell-bg grid min-h-screen place-items-center px-5 py-10"><div className="w-full max-w-md rounded-lg border border-black/10 bg-white p-7 shadow-soft"><AlertCircle className="h-8 w-8 text-brand-red" /><h1 className="mt-4 text-3xl font-black text-brand-dark">This view could not load</h1><p className="mt-3 font-semibold leading-7 text-brand-muted">Your data was not changed. Check your connection and try again.</p><Button className="mt-7 w-full" onClick={reset}>Try again</Button></div></main>;
}

