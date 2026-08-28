"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { ensureDefaultPipeline } from "@/server/admissions/queries";
import { getLaunchApplicationProgram } from "@/features/apply/programs";
import { applicationStatusSchema, publicApplicationSchema, publicEnquirySchema } from "@/features/apply/schemas";

export type PublicApplicationState = {
  ok: boolean;
  message: string;
  applicationId?: string;
  leadId?: string;
};

export type ApplicationStatusState = {
  ok: boolean;
  message: string;
  title?: string;
  program?: string;
  status?: string;
  nextStep?: string;
};

const initialState: PublicApplicationState = {
  ok: false,
  message: ""
};

export { initialState as publicApplicationInitialState };

function nullable(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function phoneCandidates(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return [];
  const digits = raw.replace(/\D/g, "");
  return Array.from(new Set([raw, normalizePhone(raw), digits, digits ? `+${digits}` : ""].filter(Boolean)));
}

async function checkPublicSubmissionLimit(kind: "application" | "enquiry" | "status", contact?: string) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
  const normalizedContact = contact ? normalizePhone(contact) : "anonymous";
  const limited = checkRateLimit(`public:${kind}:${ip}:${normalizedContact}`, kind === "status" ? 12 : 4, 15 * 60_000);

  if (!limited.allowed) {
    return {
      ok: false,
      message: "Please wait a few minutes before trying again."
    };
  }

  return null;
}

async function ensureWebsiteProgramAndReferrer(programSlug: string, referralId?: string) {
  const selectedProgram = getLaunchApplicationProgram(programSlug);
  const websiteSource = await prisma.leadSource.upsert({
    where: { name: "Website" },
    update: { active: true },
    create: { name: "Website" }
  });
  const program = await prisma.program.upsert({
    where: { slug: selectedProgram.slug },
    update: {
      name: selectedProgram.title,
      description: selectedProgram.description,
      durationDays: selectedProgram.durationDays,
      status: "ACTIVE",
      category: selectedProgram.category,
      feeType: selectedProgram.isFree ? "FREE" : "PAID",
      admissionStatus: "OPEN",
      displayOrder: selectedProgram.displayOrder,
      publicVisible: true
    },
    create: {
      name: selectedProgram.title,
      slug: selectedProgram.slug,
      description: selectedProgram.description,
      durationDays: selectedProgram.durationDays,
      status: "ACTIVE",
      category: selectedProgram.category,
      feeType: selectedProgram.isFree ? "FREE" : "PAID",
      admissionStatus: "OPEN",
      displayOrder: selectedProgram.displayOrder,
      publicVisible: true
    }
  });
  const referrer = referralId ? await prisma.user.findUnique({ where: { id: referralId }, select: { id: true } }) : null;

  return { selectedProgram, websiteSource, program, referrer };
}

async function findMatchingLead(tx: Prisma.TransactionClient, input: { phone?: string; whatsapp?: string; email?: string }) {
  const contacts = Array.from(new Set([...phoneCandidates(input.phone), ...phoneCandidates(input.whatsapp)]));
  const email = nullable(input.email)?.toLowerCase();
  const or: Prisma.LeadWhereInput[] = [];

  if (contacts.length > 0) {
    or.push({ phone: { in: contacts } }, { whatsapp: { in: contacts } });
  }

  if (email) {
    or.push({ email });
  }

  if (or.length === 0) return null;

  return tx.lead.findFirst({
    where: { OR: or },
    orderBy: { updatedAt: "desc" },
    include: { applications: true, pipelineStage: true }
  });
}

async function createOrUpdatePublicLead(
  tx: Prisma.TransactionClient,
  input: {
    name: string;
    email?: string;
    phone?: string;
    whatsapp: string;
    city: string;
    state?: string;
    programId: string;
    sourceId: string;
    pipelineStageId: string;
    ownerId?: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    notes: string;
    activityType: string;
    activitySummary: string;
    preservePipelineStage?: boolean;
  }
) {
  const matchingLead = await findMatchingLead(tx, input);
  const email = nullable(input.email)?.toLowerCase();
  const phone = input.phone?.trim() || input.whatsapp;

  if (!matchingLead) {
    const lead = await tx.lead.create({
      data: {
        name: input.name,
        email,
        phone,
        whatsapp: input.whatsapp,
        city: input.city,
        state: nullable(input.state),
        programInterestedId: input.programId,
        sourceId: input.sourceId,
        pipelineStageId: input.pipelineStageId,
        ownerId: input.ownerId ?? null,
        priority: input.priority,
        notes: input.notes
      }
    });

    await tx.leadActivity.create({
      data: {
        leadId: lead.id,
        type: input.activityType,
        summary: input.activitySummary
      }
    });

    return lead;
  }

  const lead = await tx.lead.update({
    where: { id: matchingLead.id },
    data: {
      name: input.name,
      email: email ?? matchingLead.email,
      phone,
      whatsapp: input.whatsapp,
      city: input.city,
      state: nullable(input.state) ?? matchingLead.state,
      programInterestedId: input.programId,
      sourceId: input.sourceId,
      pipelineStageId: input.preservePipelineStage ? matchingLead.pipelineStageId : input.pipelineStageId,
      ownerId: matchingLead.ownerId ?? input.ownerId ?? null,
      priority: input.priority,
      notes: [matchingLead.notes, input.notes].filter(Boolean).join("\n\n")
    }
  });

  await tx.leadActivity.create({
    data: {
      leadId: lead.id,
      type: input.activityType,
      summary: `${input.activitySummary} Existing lead reused; no duplicate lead created.`
    }
  });

  return lead;
}

async function linkReferralIfNeeded(tx: Prisma.TransactionClient, input: { referrerId?: string; leadId: string; programId: string; prefix: "APP" | "ENQ" }) {
  if (!input.referrerId) return;

  const existing = await tx.referral.findFirst({
    where: {
      referrerId: input.referrerId,
      leadId: input.leadId,
      programId: input.programId
    },
    select: { id: true }
  });

  if (existing) return;

  await tx.referral.create({
    data: {
      referrerId: input.referrerId,
      leadId: input.leadId,
      programId: input.programId,
      code: `${input.prefix}-${input.leadId}-${input.programId.slice(0, 8)}`
    }
  });
}

export async function submitPublicEnquiryAction(_: PublicApplicationState, formData: FormData): Promise<PublicApplicationState> {
  const parsed = publicEnquirySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check your details."
    };
  }

  const limited = await checkPublicSubmissionLimit("enquiry", parsed.data.whatsapp);
  if (limited) return limited;

  const stages = await ensureDefaultPipeline();
  const enquiryStage = stages.find((stage) => stage.slug === "new-lead") ?? stages[0];
  const { selectedProgram, websiteSource, program, referrer } = await ensureWebsiteProgramAndReferrer(parsed.data.programSlug, parsed.data.referralId);

  const lead = await prisma.$transaction(async (tx) => {
    const savedLead = await createOrUpdatePublicLead(tx, {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      city: parsed.data.city,
      state: parsed.data.state,
      programId: program.id,
      sourceId: websiteSource.id,
      pipelineStageId: enquiryStage.id,
      ownerId: referrer?.id ?? null,
      priority: "MEDIUM",
      notes: `Nexa enquiry for ${selectedProgram.title}. Intent: ${parsed.data.intent || parsed.data.goal}. Counselling pending.`,
      activityType: "PUBLIC_ENQUIRY_SUBMITTED",
      activitySummary: `Nexa enquiry captured for ${selectedProgram.title}. Counselling pending.`,
      preservePipelineStage: true
    });

    await linkReferralIfNeeded(tx, { referrerId: referrer?.id, leadId: savedLead.id, programId: program.id, prefix: "ENQ" });

    return savedLead;
  });

  revalidatePath("/admissions/leads");
  revalidatePath("/admissions/dashboard");

  return {
    ok: true,
    leadId: lead.id,
    message: "Your enquiry has been saved. Our Admissions Team can guide you from here."
  };
}

export async function submitPublicApplicationAction(_: PublicApplicationState, formData: FormData): Promise<PublicApplicationState> {
  const parsed = publicApplicationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check your application."
    };
  }

  const limited = await checkPublicSubmissionLimit("application", parsed.data.whatsapp);
  if (limited) return limited;

  const stages = await ensureDefaultPipeline();
  const applicationStage = stages.find((stage) => stage.slug === "application-submitted") ?? stages[0];
  const { selectedProgram, websiteSource, program, referrer } = await ensureWebsiteProgramAndReferrer(parsed.data.programSlug, parsed.data.referralId);

  const application = await prisma.$transaction(async (tx) => {
    const lead = await createOrUpdatePublicLead(tx, {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      city: parsed.data.city,
      state: parsed.data.state,
      programId: program.id,
      sourceId: websiteSource.id,
      pipelineStageId: applicationStage.id,
      ownerId: referrer?.id ?? null,
      priority: selectedProgram.isFree ? "MEDIUM" : "HIGH",
      notes: `Public application for ${selectedProgram.title}. Intent: ${parsed.data.intent || parsed.data.goal}. Counselling: ${parsed.data.counselled ?? "YES"}.`,
      activityType: "PUBLIC_APPLICATION_SUBMITTED",
      activitySummary: `Application submitted for ${selectedProgram.title}.`
    });

    await linkReferralIfNeeded(tx, { referrerId: referrer?.id, leadId: lead.id, programId: program.id, prefix: "APP" });

    const existingApplication = await tx.admissionApplication.findFirst({
      where: {
        leadId: lead.id,
        programId: program.id,
        status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED"] }
      },
      orderBy: { updatedAt: "desc" }
    });

    if (existingApplication) {
      return tx.admissionApplication.update({
        where: { id: existingApplication.id },
        data: {
          status: existingApplication.status === "DRAFT" ? "SUBMITTED" : existingApplication.status,
          submittedAt: existingApplication.submittedAt ?? new Date(),
          data: {
            programSlug: selectedProgram.slug,
            feeType: selectedProgram.isFree ? "FREE" : "PAID",
            educationOrWork: parsed.data.educationOrWork || "Counselling completed",
            goal: parsed.data.goal,
            preferredCounsellingTime: parsed.data.preferredCounsellingTime || "Admissions follow-up",
            intent: parsed.data.intent || parsed.data.goal,
            counsellingStatus: "COUNSELLING_COMPLETED",
            source: "NEXA_ONBOARDING",
            duplicatePrevented: true
          }
        }
      });
    }

    return tx.admissionApplication.create({
      data: {
        leadId: lead.id,
        programId: program.id,
        status: "SUBMITTED",
        submittedAt: new Date(),
        data: {
          programSlug: selectedProgram.slug,
          feeType: selectedProgram.isFree ? "FREE" : "PAID",
          educationOrWork: parsed.data.educationOrWork || "Counselling completed",
          goal: parsed.data.goal,
          preferredCounsellingTime: parsed.data.preferredCounsellingTime || "Admissions follow-up",
          intent: parsed.data.intent || parsed.data.goal,
          counsellingStatus: "COUNSELLING_COMPLETED",
          source: "NEXA_ONBOARDING"
        }
      }
    });
  });

  revalidatePath("/admissions/applications");
  revalidatePath("/admissions/leads");
  revalidatePath("/admissions/dashboard");

  return {
    ok: true,
    applicationId: application.id,
    message: "Your application has been sent to the AIRA Skill City Admissions Team."
  };
}

export async function checkApplicationStatusAction(_: ApplicationStatusState, formData: FormData): Promise<ApplicationStatusState> {
  const parsed = applicationStatusSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Enter your WhatsApp number."
    };
  }

  const limited = await checkPublicSubmissionLimit("status", parsed.data.whatsapp);
  if (limited) {
    return {
      ok: false,
      title: "Please wait",
      message: limited.message,
      nextStep: "Try checking again in a few minutes."
    };
  }

  const raw = parsed.data.whatsapp.trim();
  const normalized = normalizePhone(raw);
  const application = await prisma.admissionApplication.findFirst({
    where: {
      lead: {
        OR: [
          { whatsapp: raw },
          { whatsapp: normalized },
          { phone: raw },
          { phone: normalized }
        ]
      }
    },
    orderBy: { submittedAt: "desc" },
    include: {
      lead: true,
      program: true,
      studentLoginCredentials: { where: { revokedAt: null }, orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  if (!application) {
    return {
      ok: false,
      title: "Application not found",
      message: "We could not find an application for this WhatsApp number.",
      nextStep: "Check the number you used during application or submit a fresh application."
    };
  }

  const credential = application.studentLoginCredentials[0];
  if (application.status === "REJECTED") {
    return {
      ok: true,
      title: "Application reviewed",
      program: application.program.name,
      status: "Not approved",
      message: "The Admission Cell has reviewed this application.",
      nextStep: "Contact admissions if you want guidance on another program."
    };
  }

  if (application.status === "APPROVED" && credential && !credential.mustResetPin && !credential.temporary) {
    return {
      ok: true,
      title: "Dashboard active",
      program: application.program.name,
      status: "Login approved",
      message: "Your WhatsApp login is active.",
      nextStep: "Login with your WhatsApp number and private PIN."
    };
  }

  if (application.status === "APPROVED" && credential) {
    return {
      ok: true,
      title: "Login approved",
      program: application.program.name,
      status: "PIN sent",
      message: "Your temporary PIN has been prepared by the Admission Cell.",
      nextStep: "Check WhatsApp, login with the temporary PIN, then reset it."
    };
  }

  if (application.status === "APPROVED") {
    return {
      ok: true,
      title: "Admission approved",
      program: application.program.name,
      status: "Login pending",
      message: "Your admission is approved. Login access is being prepared.",
      nextStep: "The Admission Cell will send your WhatsApp PIN shortly."
    };
  }

  return {
    ok: true,
    title: "Application under review",
    program: application.program.name,
    status: application.status.replaceAll("_", " "),
    message: "Your application is in the Admission Cell review queue.",
    nextStep: "Please wait for counselling or review confirmation."
  };
}
