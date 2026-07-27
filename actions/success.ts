"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { founderProfileSchema, internshipSchema, placementApplicationSchema, placementSchema, portfolioSchema, projectSchema, resumeSchema } from "@/features/success/schemas";
import { getOrCreatePortfolio, requireSuccessStudent } from "@/server/success/queries";

type State = { ok: boolean; message: string };
function emptyToNull(value?: string) { return value && value.trim() ? value : null; }
function list(value?: string) { return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? []; }
function dateOrNull(value?: string) { return value ? new Date(value) : null; }

async function requireApprover(rolesAllowed: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => rolesAllowed.includes(role))) throw new Error("Forbidden");
  return user;
}

export async function updatePortfolioAction(_: State, formData: FormData): Promise<State> {
  const user = await requireSuccessStudent();
  const parsed = portfolioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check portfolio details." };
  const portfolio = await getOrCreatePortfolio(user.id, user.name);
  await prisma.studentPortfolio.update({ where: { id: portfolio.id }, data: { ...parsed.data, githubUrl: emptyToNull(parsed.data.githubUrl), linkedinUrl: emptyToNull(parsed.data.linkedinUrl), websiteUrl: emptyToNull(parsed.data.websiteUrl), approvalStatus: "PENDING" } });
  revalidatePath("/success/portfolio");
  return { ok: true, message: "Portfolio saved for review." };
}

export async function createProjectAction(_: State, formData: FormData): Promise<State> {
  const user = await requireSuccessStudent();
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check project details." };
  const portfolio = await getOrCreatePortfolio(user.id, user.name);
  await prisma.portfolioProject.create({ data: { studentId: user.id, portfolioId: portfolio.id, title: parsed.data.title, description: parsed.data.description, demoUrl: emptyToNull(parsed.data.demoUrl), githubUrl: emptyToNull(parsed.data.githubUrl), techStack: list(parsed.data.techStack), tags: list(parsed.data.tags), completedAt: dateOrNull(parsed.data.completedAt), featured: parsed.data.featured ?? false } });
  revalidatePath("/success/projects");
  return { ok: true, message: "Project added for mentor approval." };
}

export async function saveResumeAction(_: State, formData: FormData): Promise<State> {
  const user = await requireSuccessStudent();
  const parsed = resumeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check resume details." };
  await prisma.resumeProfile.upsert({ where: { studentId_type: { studentId: user.id, type: parsed.data.type } }, update: { headline: parsed.data.headline, summary: parsed.data.summary, aiSummary: parsed.data.summary }, create: { studentId: user.id, type: parsed.data.type, headline: parsed.data.headline, summary: parsed.data.summary, aiSummary: parsed.data.summary } });
  revalidatePath("/success/resume");
  return { ok: true, message: "Resume profile saved." };
}

export async function savePlacementAction(_: State, formData: FormData): Promise<State> {
  const user = await requireSuccessStudent();
  const parsed = placementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check placement profile." };
  await prisma.placementProfile.upsert({ where: { studentId: user.id }, update: parsed.data, create: { studentId: user.id, ...parsed.data } });
  revalidatePath("/success/placement");
  return { ok: true, message: "Placement profile saved." };
}

export async function createPlacementApplicationAction(_: State, formData: FormData): Promise<State> {
  const user = await requireSuccessStudent();
  const parsed = placementApplicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check application details." };
  const profile = await prisma.placementProfile.upsert({ where: { studentId: user.id }, update: {}, create: { studentId: user.id } });
  await prisma.placementApplication.create({ data: { profileId: profile.id, company: parsed.data.company, role: parsed.data.role, status: parsed.data.status, interviewAt: dateOrNull(parsed.data.interviewAt), offerAmount: parsed.data.offerAmount, notes: parsed.data.notes, appliedAt: new Date() } });
  revalidatePath("/success/placement");
  return { ok: true, message: "Placement application saved." };
}

export async function createInternshipAction(_: State, formData: FormData): Promise<State> {
  const user = await requireSuccessStudent();
  const parsed = internshipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check internship details." };
  await prisma.internship.create({ data: { studentId: user.id, company: parsed.data.company, role: parsed.data.role, startsAt: dateOrNull(parsed.data.startsAt), endsAt: dateOrNull(parsed.data.endsAt), status: parsed.data.status, feedback: parsed.data.feedback, completedAt: parsed.data.status === "COMPLETED" ? new Date() : null } });
  revalidatePath("/success/internships");
  return { ok: true, message: "Internship saved." };
}

export async function saveFounderProfileAction(_: State, formData: FormData): Promise<State> {
  const user = await requireSuccessStudent();
  const parsed = founderProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check founder profile." };
  await prisma.founderProfile.upsert({ where: { studentId: user.id }, update: { ...parsed.data, websiteUrl: emptyToNull(parsed.data.websiteUrl), pitchDeckUrl: emptyToNull(parsed.data.pitchDeckUrl) }, create: { studentId: user.id, ...parsed.data, websiteUrl: emptyToNull(parsed.data.websiteUrl), pitchDeckUrl: emptyToNull(parsed.data.pitchDeckUrl) } });
  revalidatePath("/success/founder-profile");
  return { ok: true, message: "Founder profile saved." };
}

export async function approvePortfolioProjectAction(projectId: string) {
  const approver = await requireApprover(["Trainer", "Director", "Admin"]);
  await prisma.portfolioProject.update({ where: { id: projectId }, data: { status: "APPROVED", mentorApproved: true, approvedById: approver.id, approvedAt: new Date() } });
  revalidatePath("/success/projects");
}

export async function verifySkillAction(studentId: string, name: string, level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL", source: string) {
  const approver = await requireApprover(["Trainer", "Director", "Admin"]);
  const portfolio = await getOrCreatePortfolio(studentId, "student");
  await prisma.verifiedSkill.create({ data: { studentId, portfolioId: portfolio.id, name, level, verificationSource: source, verifiedById: approver.id } });
  revalidatePath("/success/skills");
}

export async function issueCertificateAction(studentId: string, title: string, type: "COURSE" | "SKILL" | "ACHIEVEMENT" | "COMPLETION" | "INSTRUCTOR") {
  const approver = await requireApprover(["Director", "Admin"]);
  const portfolio = await getOrCreatePortfolio(studentId, "student");
  const certificateId = `SC-${Date.now()}-${studentId.slice(0, 6)}`;
  const certificate = await prisma.certificate.create({ data: { studentId, portfolioId: portfolio.id, title, type, status: "ISSUED", certificateId, issuedAt: new Date(), approvedById: approver.id, approvedAt: new Date(), qrPayload: `/verify/certificate/${certificateId}` } });
  await prisma.certificateVerification.create({ data: { certificateId: certificate.id, verificationCode: certificateId } });
  revalidatePath("/success/certificates");
}

export async function publishAchievementAction(studentId: string, title: string, description: string, type: "BADGE" | "MILESTONE" | "STREAK" | "HACKATHON" | "TOP_PERFORMER" | "COMMUNITY_AWARD" | "FOUNDER_ACHIEVEMENT") {
  const approver = await requireApprover(["Director", "Admin"]);
  const portfolio = await getOrCreatePortfolio(studentId, "student");
  await prisma.achievement.create({ data: { studentId, portfolioId: portfolio.id, title, description, type, status: "APPROVED", publishedById: approver.id, publishedAt: new Date() } });
  revalidatePath("/success/achievements");
}
