"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, BriefcaseBusiness, CalendarDays, Gauge, Grid2X2, ListChecks, LogOut, Menu, MoreHorizontal, Settings, X } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/ui/logo";
import { findActiveNavigationHref, selectPrimaryNavigation, type MobileNavigationItem } from "@/lib/experience/mobile-navigation";
import { cn } from "@/lib/utils";

type Props = {
  homeHref: string;
  navigation: readonly MobileNavigationItem[];
  label: string;
  hideAt?: "lg" | "xl";
};

function iconFor(item: MobileNavigationItem) {
  const value = `${item.href} ${item.label}`.toLowerCase();
  if (value.includes("dashboard") || item.label.toLowerCase() === "today") return Gauge;
  if (value.includes("task") || value.includes("action") || value.includes("follow")) return ListChecks;
  if (value.includes("career") || value.includes("opportunit")) return BriefcaseBusiness;
  if (value.includes("calendar") || value.includes("class") || value.includes("session")) return CalendarDays;
  if (value.includes("setting")) return Settings;
  return Grid2X2;
}

export function MobileAppNavigation({ homeHref, navigation, label, hideAt = "xl" }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const primary = selectPrimaryNavigation(navigation);
  const activeHref = findActiveNavigationHref(navigation, pathname);
  const breakpoint = hideAt === "lg" ? "lg:hidden" : "xl:hidden";

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...(drawer.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [])];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  return (
    <>
      <header className={cn("skillcity-mobile-header sticky top-0 z-40 px-4 py-3", breakpoint)}>
        <div className="flex min-h-12 items-center justify-between gap-3">
          <Link href={homeHref} aria-label={`${label} home`}><Logo /></Link>
          <div className="flex items-center gap-1">
            <Link href="/notifications" aria-label="Notifications" className="grid h-12 w-12 place-items-center rounded-lg text-brand-dark hover:bg-brand-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red"><Bell className="h-5 w-5" /></Link>
            <button ref={menuButton} type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)} className="grid h-12 w-12 place-items-center rounded-lg text-brand-dark hover:bg-brand-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red"><Menu className="h-6 w-6" /></button>
          </div>
        </div>
      </header>

      <nav className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(36,33,36,0.08)] backdrop-blur", breakpoint)} aria-label={`${label} primary mobile navigation`}>
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {primary.map((item) => {
            const Icon = iconFor(item);
            const active = activeHref === item.href;
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold leading-tight", active ? "bg-brand-beige text-brand-red" : "text-brand-muted")}><Icon className="h-5 w-5" /><span className="max-w-full truncate">{item.label}</span></Link>;
          })}
          <button type="button" onClick={() => setOpen(true)} aria-label="More navigation" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold text-brand-muted"><MoreHorizontal className="h-5 w-5" /><span>More</span></button>
        </div>
      </nav>

      {open ? <div className={cn("fixed inset-0 z-[70]", breakpoint)} role="dialog" aria-modal="true" aria-label={`${label} navigation`}><button type="button" className="absolute inset-0 bg-black/45" aria-label="Close navigation" onClick={() => { setOpen(false); menuButton.current?.focus(); }} /><div ref={drawer} className="absolute inset-y-0 right-0 flex w-[min(88vw,24rem)] flex-col bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-black/10 px-5 py-4"><p className="font-black text-brand-dark">{label}</p><button ref={closeButton} type="button" onClick={() => { setOpen(false); menuButton.current?.focus(); }} aria-label="Close navigation" className="grid h-12 w-12 place-items-center rounded-lg hover:bg-brand-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red"><X className="h-6 w-6" /></button></div><nav className="flex-1 overflow-y-auto px-4 py-4" aria-label={`${label} all navigation`}><div className="space-y-1">{navigation.map((item) => { const active = activeHref === item.href; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 items-center rounded-lg px-4 font-bold", active ? "bg-brand-beige text-brand-red" : "text-brand-dark hover:bg-brand-card")}>{item.label}</Link>; })}</div></nav><div className="border-t border-black/10 p-4"><Link href="/notifications" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-lg px-4 font-bold text-brand-dark hover:bg-brand-card"><Bell className="h-5 w-5" />Notifications</Link><form action={logoutAction}><button type="submit" className="flex min-h-12 w-full items-center gap-3 rounded-lg px-4 font-bold text-brand-red hover:bg-brand-card"><LogOut className="h-5 w-5" />Sign out</button></form></div></div></div> : null}
    </>
  );
}
