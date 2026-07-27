"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

type FeedbackState = { ok: boolean; message: string };

export async function saveTaraFeedbackAction(_: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please login again." };
  }

  const conversationId = String(formData.get("conversationId") ?? "");
  const messageId = String(formData.get("messageId") ?? "");
  const rating = String(formData.get("rating") ?? "");
  const comment = String(formData.get("comment") ?? "");

  if (!conversationId || !messageId || !["HELPFUL", "NOT_HELPFUL"].includes(rating)) {
    return { ok: false, message: "Feedback could not be saved." };
  }

  await prisma.aIFeedback.upsert({
    where: { userId_messageId: { userId: user.id, messageId } },
    update: { rating: rating as "HELPFUL" | "NOT_HELPFUL", comment: comment || null },
    create: {
      userId: user.id,
      conversationId,
      messageId,
      rating: rating as "HELPFUL" | "NOT_HELPFUL",
      comment: comment || null
    }
  });

  revalidatePath("/tara");
  revalidatePath("/director/tara");
  revalidatePath("/admissions/tara");
  revalidatePath("/bdm/tara");
  return { ok: true, message: "Feedback saved." };
}
