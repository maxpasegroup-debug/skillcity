import { redirect } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { markNotificationReadAction } from "@/actions/communications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const actor = await getCurrentUser();
  if (!actor) redirect("/login");
  const notifications = await prisma.notification.findMany({ where: { userId: actor.id, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <main className="skillcity-shell-bg min-h-screen py-10 text-brand-dark"><Container><PageHeader title="My Notifications" subtitle="Your operational updates from AIRA Skill City." /><div className="space-y-4">{notifications.map((item) => <Card key={item.id}><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><Bell className="mt-1 h-5 w-5 shrink-0 text-brand-red" /><div><div className="flex flex-wrap items-center gap-3"><h2 className="font-black">{item.title}</h2>{item.status === "UNREAD" ? <span className="text-xs font-black uppercase text-brand-red">New</span> : null}</div><p className="mt-2 leading-7 text-brand-muted">{item.message}</p><p className="mt-2 text-sm text-brand-muted">{item.createdAt.toLocaleString()}</p></div></div>{item.status === "UNREAD" ? <form action={markNotificationReadAction}><input type="hidden" name="notificationId" value={item.id} /><Button variant="secondary" size="md"><Check className="h-4 w-4" />Mark read</Button></form> : null}</CardContent></Card>)}{notifications.length === 0 ? <Card><CardContent className="p-8 text-brand-muted">No notifications yet.</CardContent></Card> : null}</div></Container></main>;
}
