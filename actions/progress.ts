"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/server/journey/queries";
import { assertStudentActivityAccess } from "@/server/academic/access";

export async function completeActivityAction(activityId: string) {
  const user = await requireStudent();

  const { enrollment } = await assertStudentActivityAccess(user.id, activityId);

  await prisma.studentProgress.upsert({
    where: {
      studentId_activityId: {
        studentId: user.id,
        activityId
      }
    },
    update: {
      status: "COMPLETED",
      completedAt: new Date()
    },
    create: {
      studentId: user.id,
      activityId,
      status: "COMPLETED",
      completedAt: new Date()
    }
  });

  const journeyDays = await prisma.journeyDay.findMany({
    where: {
      week: {
        phase: {
          journeyId: enrollment.journeyId
        }
      }
    },
    orderBy: [
      { week: { phase: { order: "asc" } } },
      { week: { weekNumber: "asc" } },
      { dayNumber: "asc" }
    ],
    include: {
      activities: true
    }
  });

  const currentDay = journeyDays[enrollment.currentDay - 1];
  if (currentDay) {
    const requiredIds = currentDay.activities.filter((item) => item.required).map((item) => item.id);
    const completedRequiredCount = await prisma.studentProgress.count({
      where: {
        studentId: user.id,
        activityId: { in: requiredIds },
        status: "COMPLETED"
      }
    });

    if (requiredIds.length > 0 && completedRequiredCount === requiredIds.length && enrollment.currentDay < journeyDays.length) {
      await prisma.studentEnrollment.update({
        where: { id: enrollment.id },
        data: { currentDay: enrollment.currentDay + 1 }
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-journey");
}
