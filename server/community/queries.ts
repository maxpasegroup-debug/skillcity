import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export async function requireCommunityUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getOrCreateWallet(userId: string) {
  return prisma.wallet.upsert({ where: { userId }, update: {}, create: { userId } });
}

export async function getCommunityData(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  const [groups, posts, events, challenges, listings, alumni, missions, registrations, participations, transactions, announcements, enrollment] = await Promise.all([
    prisma.communityGroup.findMany({ where: { status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, include: { memberships: true, posts: true } }),
    prisma.communityPost.findMany({ where: { hiddenAt: null }, orderBy: { createdAt: "desc" }, take: 40, include: { author: true, group: true, comments: true, reactions: true } }),
    prisma.event.findMany({ where: { status: "ACTIVE" }, orderBy: { startsAt: "asc" }, take: 40, include: { group: true, registrations: true } }),
    prisma.challenge.findMany({ where: { status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, include: { participants: true, group: true } }),
    prisma.marketplaceListing.findMany({ where: { status: "APPROVED" }, orderBy: { updatedAt: "desc" }, include: { seller: true, category: true } }),
    prisma.alumniProfile.findMany({ orderBy: { updatedAt: "desc" }, take: 30, include: { user: true } }),
    prisma.mission.findMany({ where: { active: true }, orderBy: { updatedAt: "desc" }, include: { completions: { where: { userId } } } }),
    prisma.eventRegistration.findMany({ where: { userId }, include: { event: true } }),
    prisma.challengeParticipation.findMany({ where: { userId }, include: { challenge: true } }),
    prisma.walletTransaction.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.trainerAnnouncement.findMany({ orderBy: { updatedAt: "desc" }, take: 10, include: { batch: true } }),
    prisma.studentEnrollment.findFirst({ where: { studentId: userId, status: "ACTIVE" }, include: { batch: true, program: true } })
  ]);
  return { wallet, groups, posts, events, challenges, listings, alumni, missions, registrations, participations, transactions, announcements, enrollment };
}
