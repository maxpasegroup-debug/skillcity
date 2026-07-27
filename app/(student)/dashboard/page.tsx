import Link from "next/link";
import { Award, CalendarClock, Flame, ListTodo, MessageCircle, Radio, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementList } from "@/features/journey/components/announcement-card";
import { EmptyJourneyState } from "@/features/journey/components/empty-journey-state";
import { MissionCard } from "@/features/journey/components/mission-card";
import { StatCard } from "@/features/journey/components/stat-card";
import { getStudentAnnouncements, getStudentJourney, requireStudent } from "@/server/journey/queries";

export default async function DashboardPage() {
  const user = await requireStudent();
  const [journey, announcements] = await Promise.all([getStudentJourney(user.id), getStudentAnnouncements(user.id)]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-10">
      <section className="rounded-lg bg-brand-card p-6 md:p-8">
        <p className="text-lg font-bold text-brand-red">{greeting}, {user.name}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-brand-dark md:text-6xl">Know exactly what to do today.</h1>
        {journey ? (
          <div className="mt-6 grid gap-4 text-base font-bold text-brand-muted md:grid-cols-4">
            <p>Current Program: <span className="text-brand-dark">{journey.enrollment.program.name}</span></p>
            <p>Current Batch: <span className="text-brand-dark">{journey.enrollment.batch?.name ?? "Not assigned"}</span></p>
            <p>Current Week: <span className="text-brand-dark">{journey.today ? Math.ceil(journey.today.absoluteDay / 7) : 0}</span></p>
            <p>Current Day: <span className="text-brand-dark">{journey.enrollment.currentDay}</span></p>
          </div>
        ) : null}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg"><Link href="/todays-tasks">Open Today&apos;s Mission</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/tara">Ask Tara</Link></Button>
        </div>
      </section>

      {journey?.today ? (
        <>
          <MissionCard day={journey.today} />
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Current Progress" value={`${journey.stats.progressPercent}%`} icon={TrendingUp} />
            <StatCard label="Attendance" value={journey.stats.attendanceLabel} icon={CalendarClock} />
            <StatCard label="XP" value={journey.stats.xp} icon={Award} />
            <StatCard label="Streak" value={`${journey.stats.streak} days`} icon={Flame} />
            <StatCard label="Upcoming Live Class" value={journey.stats.upcomingLiveClass ?? "None"} icon={Radio} />
            <StatCard label="Pending Tasks" value={journey.stats.pendingTasks} icon={ListTodo} />
          </section>
          <section className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardContent className="flex min-h-40 items-center gap-5 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-beige text-brand-red"><Users className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-black text-brand-dark">Community</h2>
                  <p className="mt-2 font-semibold text-brand-muted">Share progress, join challenges, and stay connected.</p>
                  <Button asChild className="mt-4" variant="secondary"><Link href="/community-hub/feed">Open Community</Link></Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex min-h-40 items-center gap-5 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-beige text-brand-red"><MessageCircle className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-black text-brand-dark">Tara AI</h2>
                  <p className="mt-2 font-semibold text-brand-muted">Ask for examples, project help, revision, or motivation.</p>
                  <Button asChild className="mt-4"><Link href="/tara">Ask Tara</Link></Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <EmptyJourneyState />
      )}

      <section>
        <h2 className="mb-5 text-3xl font-black text-brand-dark">Recent Announcements</h2>
        <AnnouncementList announcements={announcements} />
      </section>
    </div>
  );
}
