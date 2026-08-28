import Link from "next/link";
import { Award, CalendarClock, CheckCircle2, Flame, GraduationCap, ListTodo, MapPin, MessageCircle, Radio, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementList } from "@/features/journey/components/announcement-card";
import { EmptyJourneyState } from "@/features/journey/components/empty-journey-state";
import { MissionCard } from "@/features/journey/components/mission-card";
import { StatCard } from "@/features/journey/components/stat-card";
import { getStudentAnnouncements, getStudentOnboardingHome, requireStudent } from "@/server/journey/queries";

function formatDate(date?: Date | null) {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function isUrl(value?: string | null) {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

export default async function DashboardPage() {
  const user = await requireStudent();
  const [home, announcements] = await Promise.all([getStudentOnboardingHome(user.id), getStudentAnnouncements(user.id)]);
  const { journey } = home;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const statusLabel =
    home.onboardingState === "BATCH_PENDING"
      ? "Batch Assignment Pending"
      : home.onboardingState === "ORIENTATION_PENDING"
        ? "Orientation Pending"
        : home.onboardingState === "ACTIVE"
          ? "Active Student"
          : "Enrollment Pending";

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="rounded-lg bg-brand-card p-5 md:p-8">
        <p className="text-lg font-bold text-brand-red">{greeting}, {user.name}</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-brand-dark md:text-5xl">Know exactly what to do today.</h1>
        {journey ? (
          <div className="mt-6 grid gap-4 text-base font-bold text-brand-muted md:grid-cols-4">
            <p>Program: <span className="text-brand-dark">{journey.enrollment.program.name}</span></p>
            <p>Batch: <span className="text-brand-dark">{journey.enrollment.batch?.name ?? "Not assigned"}</span></p>
            <p>Status: <span className="text-brand-dark">{statusLabel}</span></p>
            <p>Current Day: <span className="text-brand-dark">{journey.enrollment.currentDay}</span></p>
          </div>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {journey?.today && home.onboardingState !== "BATCH_PENDING" ? (
            <Button asChild size="lg"><Link href="/todays-tasks">Open Today&apos;s Mission</Link></Button>
          ) : (
            <Button size="lg" disabled>Mission opens after batch assignment</Button>
          )}
          <Button asChild size="lg" variant="secondary"><Link href="/tara">Ask Tara</Link></Button>
        </div>
      </section>

      {!journey ? (
        <EmptyJourneyState />
      ) : home.onboardingState === "BATCH_PENDING" ? (
        <Card>
          <CardContent className="p-6 md:p-8">
            <p className="text-sm font-black uppercase tracking-wider text-brand-red">BATCH ASSIGNMENT PENDING</p>
            <h2 className="mt-3 text-3xl font-black text-brand-dark">Your admission is active. Batch assignment is next.</h2>
            <p className="mt-3 max-w-3xl font-semibold leading-7 text-brand-muted">The admissions team will assign your program batch. Once that is done, your orientation, next class, tasks, attendance, and progress will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-brand-red">My Program</p>
                    <h2 className="mt-2 text-2xl font-black text-brand-dark">{journey.enrollment.program.name}</h2>
                    <p className="mt-2 font-semibold text-brand-muted">{journey.enrollment.batch?.name ?? "Batch assigned"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
                    <Radio className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-brand-red">Next Class</p>
                    <h2 className="mt-2 text-2xl font-black text-brand-dark">{home.nextClass?.title ?? "Not scheduled yet"}</h2>
                    <p className="mt-2 font-semibold text-brand-muted">{home.nextClass ? formatDate(home.nextClass.startsAt) : "Your batch schedule will appear here."}</p>
                    {home.nextClass?.batch?.trainerAssignments.length ? (
                      <p className="mt-2 font-semibold text-brand-muted">Trainer: <span className="text-brand-dark">{home.nextClass.batch.trainerAssignments.map((item) => item.trainer.name).join(", ")}</span></p>
                    ) : null}
                    {home.nextClass?.location ? (
                      isUrl(home.nextClass.location) ? (
                        <Button asChild className="mt-4"><a href={home.nextClass.location} target="_blank" rel="noreferrer">Join Class</a></Button>
                      ) : (
                        <p className="mt-4 flex items-center gap-2 font-bold text-brand-dark"><MapPin className="h-5 w-5 text-brand-red" />{home.nextClass.location}</p>
                      )
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {home.onboardingState === "ORIENTATION_PENDING" ? (
            <Card>
              <CardContent className="p-6 md:p-8">
                <p className="text-sm font-black uppercase tracking-wider text-brand-red">ORIENTATION PENDING</p>
                <h2 className="mt-3 text-2xl font-black text-brand-dark">Your batch is ready. Start with orientation.</h2>
                <p className="mt-2 font-semibold leading-7 text-brand-muted">Use the next class details above for orientation or wait for your trainer&apos;s schedule update.</p>
              </CardContent>
            </Card>
          ) : null}

          {journey.today ? <MissionCard day={journey.today} /> : <EmptyJourneyState />}

          <Card>
            <CardContent className="p-6 md:p-8">
              <p className="text-sm font-black uppercase tracking-wider text-brand-red">Pending Tasks</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">Work to finish</h2>
              <div className="mt-5 grid gap-3">
                {home.pendingTasks.map((task) => (
                  <Link key={task.id} href={`/my-journey/day/${task.dayId}`} className="rounded-lg bg-white p-4 transition hover:-translate-y-1 hover:shadow-soft">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-black text-brand-dark">{task.title}</p>
                      <span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-black text-brand-dark">{task.status}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{task.dueAt ? `Due ${formatDate(task.dueAt)}` : "No due date"}</p>
                  </Link>
                ))}
                {home.pendingTasks.length === 0 ? <p className="font-semibold text-brand-muted">No pending tasks right now.</p> : null}
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Program Progress" value={`${journey.stats.progressPercent}%`} icon={TrendingUp} />
            <StatCard label="Attendance" value={home.attendance ? `${home.attendance.percent}%` : "Not started"} icon={CalendarClock} />
            <StatCard label="XP" value={journey.stats.xp} icon={Award} />
            <StatCard label="Streak" value={`${journey.stats.streak} days`} icon={Flame} />
            <StatCard label="Today's Tasks" value={home.todaysTasks} icon={ListTodo} />
            <StatCard label="Pending Submissions" value={home.pendingSubmissions} icon={CheckCircle2} />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardContent className="flex min-h-40 items-center gap-5 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-beige text-brand-red"><Users className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-black text-brand-dark">Community</h2>
                  <p className="mt-2 font-semibold text-brand-muted">Stay connected with your batch and Skill City updates.</p>
                  <Button asChild className="mt-4" variant="secondary"><Link href="/community-hub/feed">Open Community</Link></Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex min-h-40 items-center gap-5 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-beige text-brand-red"><MessageCircle className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-black text-brand-dark">Tara AI</h2>
                  <p className="mt-2 font-semibold text-brand-muted">Ask for project help, revision, examples, or next-step clarity.</p>
                  <Button asChild className="mt-4"><Link href="/tara">Ask Tara</Link></Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <section>
        <h2 className="mb-5 text-3xl font-black text-brand-dark">Recent Announcements</h2>
        <AnnouncementList announcements={announcements} />
      </section>
    </div>
  );
}
