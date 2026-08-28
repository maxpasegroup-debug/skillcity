import { CalendarClock, CheckCircle2, GraduationCap, MonitorUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BatchAssignmentForm } from "@/features/admissions/components/batch-assignment-form";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { prisma } from "@/lib/prisma";
import { getStudentBatchOnboardingQueue } from "@/server/admissions/phase5-queries";

function formatDate(date?: Date | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function capacityLabel(batch: { enrollmentLimit: number | null; enrollments: unknown[] }) {
  if (!batch.enrollmentLimit) return `${batch.enrollments.length} / Open`;
  const available = Math.max(batch.enrollmentLimit - batch.enrollments.length, 0);
  return available === 0 ? `${batch.enrollments.length} / ${batch.enrollmentLimit} - Full` : `${batch.enrollments.length} / ${batch.enrollmentLimit} - ${available} seats`;
}

export default async function EnrollmentsPage() {
  const [queue, logs] = await Promise.all([
    getStudentBatchOnboardingQueue(),
    prisma.enrollmentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { student: true, batch: true, enrollment: { include: { program: true } } }
    })
  ]);
  const batchOptions = queue.activeBatches.map((batch) => ({
    id: batch.id,
    name: batch.name,
    programId: batch.programId,
    journeyId: batch.journeyId,
    enrollmentLimit: batch.enrollmentLimit,
    enrolled: batch.enrollments.length
  }));

  return (
    <div className="space-y-10">
      <DirectorPageHeader
        eyebrow="Student + Batch Onboarding"
        title="Move admitted students into learning"
        description="Assign confirmed students to the right active batch, then class access, tasks, attendance, and progress become visible from their student dashboard."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Batch Pending" value={queue.stats.batchPending} />
        <MetricCard icon={GraduationCap} label="Active Batches" value={queue.stats.activeBatches} />
        <MetricCard icon={CalendarClock} label="Classes Today" value={queue.stats.todaysClasses} />
        <MetricCard icon={CheckCircle2} label="Students Ready" value={queue.stats.studentsReady} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-brand-red">Action Required</p>
                <h2 className="mt-2 text-2xl font-black text-brand-dark">Students waiting for batch</h2>
              </div>
              <p className="text-sm font-bold text-brand-muted">{queue.stats.availableSeats} available seats across active batches</p>
            </div>
            <div className="mt-6 space-y-5">
              {queue.batchPending.length === 0 ? (
                <p className="rounded-lg bg-brand-beige p-5 font-bold text-brand-muted">No students are waiting for batch assignment right now.</p>
              ) : (
                queue.batchPending.map((enrollment) => (
                  <div key={enrollment.id} className="rounded-lg border border-black/10 bg-white p-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                      <div>
                        <p className="text-sm font-black text-brand-red">BATCH ASSIGNMENT PENDING</p>
                        <h3 className="mt-2 text-2xl font-black text-brand-dark">{enrollment.student.name}</h3>
                        <div className="mt-3 grid gap-2 text-sm font-bold text-brand-muted sm:grid-cols-2">
                          <p>Program: <span className="text-brand-dark">{enrollment.program.name}</span></p>
                          <p>Journey: <span className="text-brand-dark">{enrollment.journey.name}</span></p>
                          <p>City: <span className="text-brand-dark">{enrollment.student.activationProfile?.city ?? "Not captured"}</span></p>
                          <p>WhatsApp: <span className="text-brand-dark">{enrollment.student.activationProfile?.whatsapp ?? "Not captured"}</span></p>
                        </div>
                      </div>
                      <BatchAssignmentForm enrollmentId={enrollment.id} programId={enrollment.programId} journeyId={enrollment.journeyId} batches={batchOptions} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 md:p-8">
            <p className="text-sm font-black uppercase tracking-wider text-brand-red">Batch Capacity</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Active batches</h2>
            <div className="mt-6 space-y-4">
              {queue.activeBatches.length === 0 ? (
                <p className="rounded-lg bg-brand-beige p-5 font-bold text-brand-muted">Create an active batch before assigning students.</p>
              ) : (
                queue.activeBatches.map((batch) => (
                  <div key={batch.id} className="rounded-lg border border-black/10 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-brand-dark">{batch.name}</h3>
                        <p className="mt-1 text-sm font-bold text-brand-muted">{batch.program.name}</p>
                      </div>
                      <span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-black text-brand-dark">{capacityLabel(batch)}</span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm font-bold text-brand-muted">
                      <p>Starts: <span className="text-brand-dark">{formatDate(batch.startsAt)}</span></p>
                      <p>Trainer: <span className="text-brand-dark">{batch.trainerAssignments.map((item) => item.trainer.name).join(", ") || "Not assigned"}</span></p>
                      <p>Next class: <span className="text-brand-dark">{batch.calendarEvents[0] ? `${batch.calendarEvents[0].title} - ${formatDate(batch.calendarEvents[0].startsAt)}` : "Not scheduled"}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="p-6 md:p-8">
            <p className="text-sm font-black uppercase tracking-wider text-brand-red">Learning Access</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Recently ready students</h2>
            <div className="mt-6 space-y-4">
              {queue.readyEnrollments.length === 0 ? (
                <p className="font-bold text-brand-muted">Batch-assigned students will appear here.</p>
              ) : (
                queue.readyEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="rounded-lg border border-black/10 bg-white p-5">
                    <p className="text-sm font-black text-brand-red">STUDENT READY</p>
                    <h3 className="mt-2 text-xl font-black text-brand-dark">{enrollment.student.name}</h3>
                    <p className="mt-2 text-sm font-bold text-brand-muted">{enrollment.program.name} - {enrollment.batch?.name ?? "Batch assigned"}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 md:p-8">
            <p className="text-sm font-black uppercase tracking-wider text-brand-red">Activity</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Enrollment timeline</h2>
            <div className="mt-6 space-y-4">
              {logs.length === 0 ? (
                <p className="font-bold text-brand-muted">Enrollment logs will appear when paid leads are converted.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-black/10 bg-white p-5">
                    <p className="text-sm font-black text-brand-red">{log.action}</p>
                    <h3 className="mt-2 text-xl font-black text-brand-dark">{log.student.name}</h3>
                    <p className="mt-2 text-sm font-bold text-brand-muted">{log.enrollment?.program.name ?? "Program"} - {log.batch?.name ?? "Batch pending"}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-brand-red">Online / Offline Readiness</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Class access follows scheduled batch events</h2>
            <p className="mt-2 max-w-3xl font-semibold text-brand-muted">Google Meet, Zoom, or venue details should be placed in the existing calendar event location field for the batch. Students see the correct join or venue action automatically.</p>
          </div>
          <MonitorUp className="h-10 w-10 shrink-0 text-brand-red" />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-beige text-brand-red">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-brand-muted">{label}</p>
          <p className="text-2xl font-black text-brand-dark">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
