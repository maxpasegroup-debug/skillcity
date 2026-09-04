import { z } from "zod";
import { careerCategories, careerRoles } from "@/features/careers/catalog";

const roleSlugs = careerRoles.map((role) => role.slug) as [string, ...string[]];
const categorySlugs = careerCategories.map((category) => category.slug) as [string, ...string[]];

export const careerApplicationSchema = z.object({
  roleSlug: z.enum(roleSlugs),
  categorySlug: z.enum(categorySlugs),
  applicationDate: z.string().trim().min(1, "Choose the application date.").max(40),
  applicationDay: z.string().trim().max(40).optional().or(z.literal("")),
  candidateName: z.string().trim().min(2, "Enter your name.").max(160),
  fatherName: z.string().trim().min(2, "Enter father's name.").max(160),
  dateOfBirth: z.string().trim().min(1, "Choose date of birth.").max(40),
  age: z.coerce.number().int().min(16, "Enter a valid age.").max(80, "Enter a valid age."),
  mobile: z.string().trim().min(7, "Enter a valid mobile number.").max(40),
  whatsapp: z.string().trim().min(7, "Enter a valid WhatsApp number.").max(40),
  email: z.string().trim().email("Enter a valid email.").max(255),
  district: z.string().trim().min(2, "Enter your district.").max(120),
  education: z.string().trim().min(2, "Share your education.").max(180),
  qualification: z.string().trim().max(180).optional().or(z.literal("")),
  bloodGroup: z.string().trim().min(1, "Select blood group.").max(20),
  birthMarks: z.string().trim().max(500).optional().or(z.literal("")),
  maritalStatus: z.string().trim().min(2, "Select marital status.").max(80),
  nationality: z.string().trim().min(2, "Enter nationality.").max(120),
  aadhaarNo: z.string().trim().min(4, "Enter Aadhaar number.").max(20),
  designation: z.string().trim().min(2, "Select designation.").max(160),
  nomineeName: z.string().trim().min(2, "Enter nominee name.").max(160),
  nomineeRelationship: z.string().trim().min(2, "Select nominee relationship.").max(80),
  emergencyContact: z.string().trim().min(7, "Enter emergency contact number.").max(40),
  emergencyRelationship: z.string().trim().min(2, "Select emergency relationship.").max(80),
  presentAddress: z.string().trim().min(8, "Enter present address.").max(900),
  permanentAddress: z.string().trim().min(8, "Enter permanent address.").max(900),
  panSubmitted: z.enum(["YES", "NO"], { message: "Choose PAN copy submission status." }),
  aadhaarSubmitted: z.enum(["YES", "NO"], { message: "Choose Aadhaar copy submission status." }),
  candidateSignature: z.string().trim().min(2, "Enter candidate signature/name.").max(160),
  experience: z.string().trim().max(500).optional().or(z.literal("")),
  currentStatus: z.string().trim().min(2, "Share your current status.").max(180),
  relevantSkills: z.string().trim().max(500).optional().or(z.literal("")),
  resumeUrl: z.string().trim().url("Enter a valid resume link.").max(600).optional().or(z.literal("")),
  profileUrl: z.string().trim().url("Enter a valid profile link.").max(600).optional().or(z.literal("")),
  shortIntro: z.string().trim().min(10, "Write a short introduction.").max(900),
  availability: z.string().trim().min(2, "Share your availability.").max(120),
  preferredLocation: z.string().trim().min(2, "Enter preferred location.").max(120),
  consent: z.literal("on", { message: "Consent is required." })
});

export const careerStageUpdateSchema = z.object({
  applicationId: z.string().uuid(),
  stage: z.enum([
    "NEW_APPLICATION",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEW_COMPLETED",
    "SELECTED",
    "OFFER_SENT",
    "OFFER_ACCEPTED",
    "JOINED",
    "TRAINING",
    "ACTIVE",
    "REJECTED",
    "ON_HOLD"
  ]),
  note: z.string().trim().max(700).optional().or(z.literal(""))
});

export const careerNoteSchema = z.object({
  applicationId: z.string().uuid(),
  note: z.string().trim().min(2, "Add a note.").max(900)
});

export const interviewSchema = z.object({
  applicationId: z.string().uuid(),
  interviewerId: z.string().uuid().optional().or(z.literal("")),
  scheduledAt: z.string().trim().min(1, "Choose interview time."),
  mode: z.string().trim().min(2).max(80),
  meetingLink: z.string().trim().url().max(600).optional().or(z.literal("")),
  notes: z.string().trim().max(700).optional().or(z.literal(""))
});

export const interviewResultSchema = z.object({
  interviewId: z.string().uuid(),
  result: z.string().trim().min(2).max(80),
  feedback: z.string().trim().max(900).optional().or(z.literal(""))
});

export const officeInterviewFormSchema = z.object({
  applicationId: z.string().uuid(),
  round1Type: z.string().trim().max(120).optional().or(z.literal("")),
  round1DateTime: z.string().trim().max(80).optional().or(z.literal("")),
  round1InterviewerName: z.string().trim().max(160).optional().or(z.literal("")),
  round1Remarks: z.string().trim().max(900).optional().or(z.literal("")),
  round1Signature: z.string().trim().max(160).optional().or(z.literal("")),
  round2Type: z.string().trim().max(120).optional().or(z.literal("")),
  round2DateTime: z.string().trim().max(80).optional().or(z.literal("")),
  round2InterviewerName: z.string().trim().max(160).optional().or(z.literal("")),
  round2Remarks: z.string().trim().max(900).optional().or(z.literal("")),
  round2Signature: z.string().trim().max(160).optional().or(z.literal("")),
  round3Type: z.string().trim().max(120).optional().or(z.literal("")),
  round3DateTime: z.string().trim().max(80).optional().or(z.literal("")),
  round3InterviewerName: z.string().trim().max(160).optional().or(z.literal("")),
  round3Remarks: z.string().trim().max(900).optional().or(z.literal("")),
  round3Signature: z.string().trim().max(160).optional().or(z.literal("")),
  round4Type: z.string().trim().max(120).optional().or(z.literal("")),
  round4DateTime: z.string().trim().max(80).optional().or(z.literal("")),
  round4InterviewerName: z.string().trim().max(160).optional().or(z.literal("")),
  round4Remarks: z.string().trim().max(900).optional().or(z.literal("")),
  round4Signature: z.string().trim().max(160).optional().or(z.literal("")),
  round5Type: z.string().trim().max(120).optional().or(z.literal("")),
  round5DateTime: z.string().trim().max(80).optional().or(z.literal("")),
  round5InterviewerName: z.string().trim().max(160).optional().or(z.literal("")),
  round5Remarks: z.string().trim().max(900).optional().or(z.literal("")),
  round5Signature: z.string().trim().max(160).optional().or(z.literal("")),
  finalResult: z.enum(["", "HOLD", "SELECTED", "NOT_SELECTED"]).optional(),
  finalRemarks: z.string().trim().max(1200).optional().or(z.literal("")),
  joiningDate: z.string().trim().max(40).optional().or(z.literal("")),
  joiningTime: z.string().trim().max(40).optional().or(z.literal(""))
});

export const rmDevelopmentStartSchema = z.object({
  developmentId: z.string().uuid(),
  employeeId: z.string().uuid("Select the Relationship Manager employee."),
  developmentStart: z.string().trim().min(1, "Choose a start date."),
  targetAdmissions: z.coerce.number().int().min(1).max(1000).default(120)
});

export const rmDevelopmentTargetSchema = z.object({
  developmentId: z.string().uuid(),
  targetAdmissions: z.coerce.number().int().min(1).max(1000),
  note: z.string().trim().max(700).optional().or(z.literal(""))
});

export const rmEvaluationSchema = z.object({
  developmentId: z.string().uuid(),
  status: z.enum(["IN_PROGRESS", "EVALUATION_PENDING", "ELIGIBLE", "NOT_ELIGIBLE", "COMPLETED"]),
  finalDecision: z.string().trim().min(2).max(180),
  evaluationNotes: z.string().trim().min(2).max(1200)
});
