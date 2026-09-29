import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

export default function OfflinePage() {
  return <main className="skillcity-shell-bg grid min-h-screen place-items-center px-5 py-10"><Card className="w-full max-w-md"><CardContent className="p-7 sm:p-9"><Logo /><WifiOff className="mt-10 h-8 w-8 text-brand-red" /><h1 className="mt-4 text-3xl font-black text-brand-dark">You are offline</h1><p className="mt-3 font-semibold leading-7 text-brand-muted">Reconnect to access live learning, admissions, finance, communications, AI, and account data.</p><Button asChild className="mt-7 w-full"><Link href="/">Try again</Link></Button></CardContent></Card></main>;
}

