import type { CareerRecruitmentStage } from "@prisma/client";

export const recruitmentStages: CareerRecruitmentStage[] = [
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
];
