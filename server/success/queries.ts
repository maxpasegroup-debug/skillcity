import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export async function requireSuccessStudent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "student";
}

export async function getOrCreatePortfolio(studentId: string, name: string) {
  const existing = await prisma.studentPortfolio.findUnique({ where: { studentId } });
  if (existing) return existing;
  const base = slugify(name);
  const publicSlug = `${base}-${studentId.slice(0, 8)}`;
  return prisma.studentPortfolio.create({ data: { studentId, publicSlug } });
}

export async function getSuccessData(studentId: string, name: string) {
  const portfolio = await getOrCreatePortfolio(studentId, name);
  const [enrollments, projects, skills, certificates, achievements, resumes, placement, internships, founder, milestones, approvedSubmissions] = await Promise.all([
    prisma.studentEnrollment.findMany({ where: { studentId }, include: { program: true } }),
    prisma.portfolioProject.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" }, include: { approvedBy: true } }),
    prisma.verifiedSkill.findMany({ where: { studentId }, orderBy: { earnedAt: "desc" }, include: { evidence: true, verifiedBy: true } }),
    prisma.certificate.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, include: { verifications: true, program: true, skill: true } }),
    prisma.achievement.findMany({ where: { studentId }, orderBy: { earnedAt: "desc" } }),
    prisma.resumeProfile.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
    prisma.placementProfile.findUnique({ where: { studentId }, include: { applications: { orderBy: { updatedAt: "desc" } } } }),
    prisma.internship.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" }, include: { mentor: true } }),
    prisma.founderProfile.findUnique({ where: { studentId } }),
    prisma.careerMilestone.findMany({ where: { studentId }, orderBy: { achievedAt: "desc" } }),
    prisma.submission.findMany({ where: { studentId, status: "APPROVED" }, orderBy: { updatedAt: "desc" }, take: 20 })
  ]);
  return { portfolio, enrollments, projects, skills, certificates, achievements, resumes, placement, internships, founder, milestones, approvedSubmissions };
}
