"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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

export async function submitPublicEnquiryAction(_: PublicApplicationState, formData: FormData): Promise<PublicApplicationState> {
  const parsed = publicEnquirySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check your details."
    };
  }

  const stages = await ensureDefaultPipeline();
  const enquiryStage = stages.find((stage) => stage.slug === "new-lead") ?? stages[0];
  const { selectedProgram, websiteSource, program, referrer } = await ensureWebsiteProgramAndReferrer(parsed.data.programSlug, parsed.data.referralId);

  const lead = await prisma.$transaction(async (tx) => {
    const createdLead = await tx.lead.create({
      data: {
        name: parsed.data.name,
        email: nullable(parsed.data.email),
        phone: parsed.data.phone?.trim() || parsed.data.whatsapp,
        whatsapp: parsed.data.whatsapp,
        city: parsed.data.city,
        state: nullable(parsed.data.state),
        programInterestedId: program.id,
        sourceId: websiteSource.id,
        pipelineStageId: enquiryStage.id,
        ownerId: referrer?.id ?? null,
        priority: "MEDIUM",
        notes: `Nexa enquiry for ${selectedProgram.title}. Intent: ${parsed.data.intent || parsed.data.goal}. Counselling pending.`
      }
    });

    await tx.leadActivity.create({
      data: {
        leadId: createdLead.id,
        type: "PUBLIC_ENQUIRY_SUBMITTED",
        summary: `Nexa enquiry captured for ${selectedProgram.title}. Counselling pending.`
      }
    });

    if (referrer) {
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          leadId: createdLead.id,
          programId: program.id,
          code: `ENQ-${createdLead.id}`
        }
      });
    }

    return createdLead;
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

  const stages = await ensureDefaultPipeline();
  const applicationStage = stages.find((stage) => stage.slug === "application-submitted") ?? stages[0];
  const { selectedProgram, websiteSource, program, referrer } = await ensureWebsiteProgramAndReferrer(parsed.data.programSlug, parsed.data.referralId);

  const application = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        name: parsed.data.name,
        email: nullable(parsed.data.email),
        phone: parsed.data.phone?.trim() || parsed.data.whatsapp,
        whatsapp: parsed.data.whatsapp,
        city: parsed.data.city,
        state: nullable(parsed.data.state),
        programInterestedId: program.id,
        sourceId: websiteSource.id,
        pipelineStageId: applicationStage.id,
        ownerId: referrer?.id ?? null,
        priority: selectedProgram.isFree ? "MEDIUM" : "HIGH",
        notes: `Public application for ${selectedProgram.title}. Intent: ${parsed.data.intent || parsed.data.goal}. Counselling: ${parsed.data.counselled ?? "YES"}.`
      }
    });

    await tx.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "PUBLIC_APPLICATION_SUBMITTED",
        summary: `Application submitted for ${selectedProgram.title}.`
      }
    });

    if (referrer) {
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          leadId: lead.id,
          programId: program.id,
          code: `APP-${lead.id}`
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
