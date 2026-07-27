"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { challengeSchema, eventSchema, groupSchema, listingSchema, postSchema } from "@/features/community/schemas";
import { getOrCreateWallet, requireCommunityUser } from "@/server/community/queries";

type State = { ok: boolean; message: string };
function emptyToNull(value?: string) { return value && value.trim() ? value : null; }
function list(value?: string) { return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? []; }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }

export async function createPostAction(_: State, formData: FormData): Promise<State> {
  const user = await requireCommunityUser();
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check post details." };
  await prisma.communityPost.create({ data: { authorId: user.id, groupId: emptyToNull(parsed.data.groupId), title: parsed.data.title, content: parsed.data.content, type: parsed.data.type, resourceUrl: emptyToNull(parsed.data.resourceUrl), tags: list(parsed.data.tags) } });
  const wallet = await getOrCreateWallet(user.id);
  await prisma.wallet.update({ where: { id: wallet.id }, data: { xp: { increment: 5 }, skillCoins: { increment: 1 } } });
  await prisma.walletTransaction.create({ data: { walletId: wallet.id, actorId: user.id, type: "EARNED", xp: 5, coins: 1, reason: "Community contribution" } });
  revalidatePath("/community-hub/feed");
  return { ok: true, message: "Post shared." };
}

export async function createGroupAction(_: State, formData: FormData): Promise<State> {
  const user = await requireCommunityUser();
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check group details." };
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => ["Director", "Admin"].includes(role))) return { ok: false, message: "Only Director or Admin can create groups." };
  const group = await prisma.communityGroup.create({ data: { creatorId: user.id, name: parsed.data.name, slug: `${slugify(parsed.data.name)}-${Date.now()}`, description: parsed.data.description, type: parsed.data.type } });
  await prisma.communityMembership.create({ data: { groupId: group.id, userId: user.id, role: "Owner" } });
  revalidatePath("/community-hub/groups");
  return { ok: true, message: "Group created." };
}

export async function createEventAction(_: State, formData: FormData): Promise<State> {
  const user = await requireCommunityUser();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check event details." };
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => ["Director", "Trainer", "Admin"].includes(role))) return { ok: false, message: "Only Director, Trainer or Admin can create events." };
  await prisma.event.create({ data: { groupId: emptyToNull(parsed.data.groupId), title: parsed.data.title, description: parsed.data.description, type: parsed.data.type, capacity: parsed.data.capacity, startsAt: new Date(parsed.data.startsAt), meetingLink: emptyToNull(parsed.data.meetingLink) } });
  revalidatePath("/community-hub/events");
  return { ok: true, message: "Event created." };
}

export async function registerEventAction(eventId: string) {
  const user = await requireCommunityUser();
  await prisma.eventRegistration.upsert({ where: { eventId_userId: { eventId, userId: user.id } }, update: { status: "REGISTERED" }, create: { eventId, userId: user.id } });
  revalidatePath("/community-hub/events");
}

export async function createChallengeAction(_: State, formData: FormData): Promise<State> {
  const user = await requireCommunityUser();
  const parsed = challengeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check challenge details." };
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => ["Director", "Trainer", "Admin"].includes(role))) return { ok: false, message: "Only Director, Trainer or Admin can create challenges." };
  await prisma.challenge.create({ data: { groupId: emptyToNull(parsed.data.groupId), title: parsed.data.title, description: parsed.data.description, rewardXp: parsed.data.rewardXp, rewardCoins: parsed.data.rewardCoins, status: "ACTIVE" } });
  revalidatePath("/community-hub/challenges");
  return { ok: true, message: "Challenge created." };
}

export async function joinChallengeAction(challengeId: string) {
  const user = await requireCommunityUser();
  await prisma.challengeParticipation.upsert({ where: { challengeId_userId: { challengeId, userId: user.id } }, update: { status: "ACTIVE" }, create: { challengeId, userId: user.id } });
  revalidatePath("/community-hub/challenges");
}

export async function createListingAction(_: State, formData: FormData): Promise<State> {
  const user = await requireCommunityUser();
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check listing details." };
  const category = await prisma.marketplaceCategory.upsert({ where: { name: parsed.data.categoryName }, update: {}, create: { name: parsed.data.categoryName } });
  await prisma.marketplaceListing.create({ data: { sellerId: user.id, categoryId: category.id, type: parsed.data.type, title: parsed.data.title, description: parsed.data.description, url: emptyToNull(parsed.data.url), priceCoins: parsed.data.priceCoins } });
  revalidatePath("/community-hub/marketplace");
  return { ok: true, message: "Listing submitted for approval." };
}
