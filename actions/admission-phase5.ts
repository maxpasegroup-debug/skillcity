"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assignStudentBatchSchema } from "@/features/admissions/phase5-schemas";
import { ensureDefaultPipeline, requireAdmissionUser } from "@/server/admissions/queries";

type State = { ok: boolean; message: string };

async function stageId(slug: string) {
  const stages = await ensureDefaultPipeline();
  return stages.find((stage) => stage.slug === slug)?.id;
}

export async function assignStudentBatchAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = assignStudentBatchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the batch assignment." };
  }

  const [enrollment, batch] = await Promise.all([
    prisma.studentEnrollment.findUnique({
      where: { id: parsed.data.enrollmentId },
      include: { student: true, program: true, journey: true, batch: true }
    }),
    prisma.batch.findUnique({
      where: { id: parsed.data.batchId },
      include: {
        program: true,
        journey: true,
        enrollments: { where: { status: "ACTIVE" }, select: { id: true, studentId: true } }
      }
    })
  ]);

  if (!enrollment) return { ok: false, message: "Student enrollment not found." };
  if (enrollment.status !== "ACTIVE") return { ok: false, message: "Only active enrollments can be assigned to a batch." };
  if (!batch) return { ok: false, message: "Batch not found." };
  if (batch.status !== "ACTIVE") return { ok: false, message: "Assign students only to active batches." };
  if (batch.programId !== enrollment.programId) return { ok: false, message: "This batch belongs to a different program." };
  if (batch.journeyId && batch.journeyId !== enrollment.journeyId) return { ok: false, message: "This batch is attached to a different journey." };

  const alreadyInBatch = enrollment.batchId === batch.id;
  const activeSeats = batch.enrollments.filter((item) => item.id !== enrollment.id).length;
  if (!alreadyInBatch && batch.enrollmentLimit && activeSeats >= batch.enrollmentLimit) {
    return { ok: false, message: "This batch is full." };
  }

  const duplicateBatchAssignment = await prisma.studentEnrollment.findFirst({
    where: {
      id: { not: enrollment.id },
      studentId: enrollment.studentId,
      programId: enrollment.programId,
      status: "ACTIVE",
      batchId: { not: null }
    },
    include: { batch: true }
  });
  if (duplicateBatchAssignment) {
    return { ok: false, message: `This student is already active in ${duplicateBatchAssignment.batch?.name ?? "another batch"}.` };
  }

  if (alreadyInBatch) return { ok: true, message: `${enrollment.student.name} is already assigned to ${batch.name}.` };

  const application = await prisma.admissionApplication.findFirst({
    where: { studentId: enrollment.studentId, programId: enrollment.programId },
    orderBy: { updatedAt: "desc" },
    include: { lead: true }
  });
  const batchAssignedStageId = await stageId("batch-assigned");
  const note = parsed.data.note?.trim();

  await prisma.$transaction(async (tx) => {
    await tx.studentEnrollment.update({
      where: { id: enrollment.id },
      data: { batchId: batch.id }
    });

    await tx.enrollmentLog.create({
      data: {
        studentId: enrollment.studentId,
        batchId: batch.id,
        enrollmentId: enrollment.id,
        action: "BATCH_ASSIGNED",
        metadata: {
          actorId: actor.id,
          programId: enrollment.programId,
          previousBatchId: enrollment.batchId,
          note: note || null
        }
      }
    });

    if (application?.leadId) {
      await tx.lead.update({
        where: { id: application.leadId },
        data: { pipelineStageId: batchAssignedStageId ?? application.lead.pipelineStageId }
      });
      await tx.leadActivity.create({
        data: {
          leadId: application.leadId,
          actorId: actor.id,
          type: "BATCH_ASSIGNED",
          summary: `${enrollment.student.name} assigned to ${batch.name} for ${enrollment.program.name}.`
        }
      });
      if (note) {
        await tx.leadNote.create({ data: { leadId: application.leadId, authorId: actor.id, note } });
      }
    }

    await tx.notification.create({
      data: {
        userId: enrollment.studentId,
        type: "SYSTEM",
        title: "Batch assigned",
        message: `You are now assigned to ${batch.name}. Your classes and tasks will appear on your dashboard.`,
        actionUrl: "/dashboard"
      }
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "STUDENT_BATCH_ASSIGNED",
        entity: "StudentEnrollment",
        entityId: enrollment.id,
        metadata: { studentId: enrollment.studentId, batchId: batch.id, applicationId: application?.id ?? null }
      }
    });
  });

  revalidatePath("/admissions/enrollments");
  revalidatePath("/admissions/action-queue");
  revalidatePath("/admin/dashboard");
  revalidatePath("/director/batch-management");
  revalidatePath("/dashboard");
  return { ok: true, message: `${enrollment.student.name} assigned to ${batch.name}.` };
}
