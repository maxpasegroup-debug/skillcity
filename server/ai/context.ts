import type { AIConversationScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TaraContext } from "@/types/tara";

export async function buildTaraContext(userId: string, scope: AIConversationScope): Promise<TaraContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        orderBy: { startedAt: "desc" },
        take: 1,
        include: {
          program: true,
          batch: true,
          journey: {
            include: {
              phases: {
                orderBy: { order: "asc" },
                include: {
                  weeks: {
                    orderBy: { weekNumber: "asc" },
                    include: {
                      days: {
                        orderBy: { dayNumber: "asc" },
                        include: {
                          learningFlow: true,
                          activities: {
                            orderBy: { sortOrder: "asc" },
                            include: { progress: { where: { studentId: userId } } }
                          },
                          dailyLearningSessions: { where: { studentId: userId }, include: { currentStep: true } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const enrollment = user.enrollments[0];
  const days = enrollment?.journey.phases.flatMap((phase) => phase.weeks.flatMap((week) => week.days.map((day) => ({ phase, week, day })))) ?? [];
  const current = enrollment ? days[enrollment.currentDay - 1] : undefined;
  const currentDay = current?.day;
  const completedActivities = currentDay?.activities.filter((activity) => activity.progress.some((item) => item.status === "COMPLETED")).map((activity) => activity.title) ?? [];
  const pendingActivities = currentDay?.activities.filter((activity) => !activity.progress.some((item) => item.status === "COMPLETED")).map((activity) => activity.title) ?? [];

  const [reflections, submissions, assessments, announcements, calendarEvents] = await Promise.all([
    prisma.studentReflection.findMany({
      where: { studentId: userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { reflection: true }
    }),
    prisma.submission.findMany({ where: { studentId: userId }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.assessmentResult.findMany({ where: { studentId: userId }, orderBy: { completedAt: "desc" }, take: 8 }),
    prisma.announcement.findMany({
      where: {
        publishedAt: { lte: new Date() },
        OR: [{ audience: "ALL" }, { programId: enrollment?.programId }, { batchId: enrollment?.batchId }]
      },
      orderBy: { publishedAt: "desc" },
      take: 5
    }),
    prisma.calendarEvent.findMany({
      where: {
        startsAt: { gte: new Date() },
        OR: [{ programId: enrollment?.programId }, { batchId: enrollment?.batchId }, { programId: null, batchId: null }]
      },
      orderBy: { startsAt: "asc" },
      take: 6
    })
  ]);

  const crm =
    scope === "ADMISSION" || scope === "BDM"
      ? await buildCrmContext(userId, scope)
      : undefined;
  const success = await buildSuccessContext(userId);
  const community = await buildCommunityContext(userId);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles.map((item) => item.role.name)
    },
    scope,
    program: enrollment?.program.name,
    journey: enrollment?.journey.name,
    batch: enrollment?.batch?.name,
    currentDay: currentDay ? `Day ${enrollment?.currentDay}: ${currentDay.title}` : undefined,
    currentWeek: current ? current.week.weekNumber : undefined,
    learningFlow: currentDay?.learningFlow?.name,
    currentActivity: currentDay?.dailyLearningSessions[0]?.currentStep?.title,
    completedActivities,
    pendingActivities,
    reflections: reflections.map((item) => `${item.reflection.question}: ${item.answer}`),
    submissions: submissions.map((item) => `${item.title} (${item.status})`),
    assessments: assessments.map((item) => `${item.type}: ${item.score}/${item.maxScore}`),
    announcements: announcements.map((item) => item.title),
    calendarEvents: calendarEvents.map((item) => `${item.title} on ${item.startsAt.toDateString()}`),
    crm,
    success,
    community
  };
}

async function buildCommunityContext(userId: string) {
  const [memberships, events, challenges, wallet, listings, alumni] = await Promise.all([
    prisma.communityMembership.findMany({ where: { userId }, include: { group: true }, take: 8 }),
    prisma.event.findMany({ where: { status: "ACTIVE", startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 8 }),
    prisma.challenge.findMany({ where: { status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.marketplaceListing.findMany({ where: { status: "APPROVED" }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.alumniProfile.findMany({ orderBy: { updatedAt: "desc" }, take: 5, include: { user: true } })
  ]);
  return {
    groups: memberships.map((item) => `${item.group.name} - ${item.group.type}`),
    events: events.map((item) => `${item.title} - ${item.type} on ${item.startsAt.toDateString()}`),
    challenges: challenges.map((item) => `${item.title} - ${item.rewardXp} XP`),
    wallet: wallet ? `${wallet.xp} XP, ${wallet.skillCoins} Skill Coins, level ${wallet.level}` : undefined,
    marketplace: listings.map((item) => `${item.title} - ${item.type}`),
    alumni: alumni.map((item) => `${item.user.name} - ${item.employment ?? item.business ?? "community"}`)
  };
}

async function buildSuccessContext(userId: string) {
  const [portfolio, projects, skills, certificates, achievements, resumes, placement, internships, founder] = await Promise.all([
    prisma.studentPortfolio.findUnique({ where: { studentId: userId } }),
    prisma.portfolioProject.findMany({ where: { studentId: userId }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.verifiedSkill.findMany({ where: { studentId: userId }, orderBy: { earnedAt: "desc" }, take: 12 }),
    prisma.certificate.findMany({ where: { studentId: userId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.achievement.findMany({ where: { studentId: userId }, orderBy: { earnedAt: "desc" }, take: 8 }),
    prisma.resumeProfile.findMany({ where: { studentId: userId }, orderBy: { updatedAt: "desc" }, take: 3 }),
    prisma.placementProfile.findUnique({ where: { studentId: userId } }),
    prisma.internship.findMany({ where: { studentId: userId }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.founderProfile.findUnique({ where: { studentId: userId } })
  ]);
  return {
    portfolioStatus: portfolio ? `${portfolio.approvalStatus} - ${portfolio.visibility}` : undefined,
    projects: projects.map((item) => `${item.title} (${item.status})`),
    skills: skills.map((item) => `${item.name} - ${item.level}`),
    certificates: certificates.map((item) => `${item.title} - ${item.status}`),
    achievements: achievements.map((item) => `${item.title} - ${item.type}`),
    resumes: resumes.map((item) => `${item.type}: ${item.headline ?? "headline pending"}`),
    placement: placement ? `${placement.status} - readiness ${placement.readinessScore}%` : undefined,
    internships: internships.map((item) => `${item.company} - ${item.role} - ${item.status}`),
    founderProfile: founder ? `${founder.businessName ?? "Business"} - ${founder.revenueStage}` : undefined
  };
}

async function buildCrmContext(userId: string, scope: AIConversationScope) {
  const leadWhere = scope === "BDM" ? { assignedToId: userId } : {};
  const [leads, pipeline, counselling, pendingPayments, pendingDocuments, commissions, referrals] = await Promise.all([
    prisma.lead.findMany({
      where: leadWhere,
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: { pipelineStage: true, programInterested: true }
    }),
    prisma.pipelineStage.findMany({
      orderBy: { order: "asc" },
      include: { leads: { where: leadWhere, select: { id: true } } }
    }),
    prisma.counsellingSession.findMany({
      where: { scheduledAt: { gte: new Date() }, ...(scope === "BDM" ? { lead: { assignedToId: userId } } : {}) },
      orderBy: { scheduledAt: "asc" },
      take: 8,
      include: { lead: true }
    }),
    prisma.feeInvoice.findMany({
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] }, ...(scope === "BDM" ? { lead: { assignedToId: userId } } : {}) },
      orderBy: { dueAt: "asc" },
      take: 8,
      include: { lead: true }
    }),
    prisma.studentDocument.findMany({
      where: { status: "PENDING", ...(scope === "BDM" ? { application: { lead: { assignedToId: userId } } } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { application: { include: { lead: true } } }
    }),
    prisma.commissionRecord.findMany({
      where: scope === "BDM" ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { program: true }
    }),
    prisma.referral.findMany({
      where: scope === "BDM" ? { referrerId: userId } : {},
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { program: true, lead: true }
    })
  ]);

  return {
    assignedLeads: leads.map((lead) => `${lead.name} - ${lead.pipelineStage.name} - ${lead.priority} - ${lead.programInterested?.name ?? "program pending"}`),
    pipelineSummary: pipeline.map((stage) => `${stage.name}: ${stage.leads.length}`),
    upcomingCounselling: counselling.map((item) => `${item.lead.name} on ${item.scheduledAt.toDateString()} (${item.outcome})`),
    pendingPayments: pendingPayments.map((invoice) => `${invoice.invoiceNo} - INR ${invoice.total} - ${invoice.lead?.name ?? "student"}`),
    pendingDocuments: pendingDocuments.map((document) => `${document.title} - ${document.application?.lead.name ?? "student"}`),
    commissions: commissions.map((commission) => `${commission.type} - INR ${commission.amount} - ${commission.status}`),
    referrals: referrals.map((referral) => `${referral.code} - ${referral.convertedAt ? "converted" : "open"} - ${referral.program?.name ?? "all programs"}`)
  };
}
