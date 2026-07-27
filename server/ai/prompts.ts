import type { AIConversationScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TaraContext } from "@/types/tara";

export type PromptTemplateDefinition = {
  key: string;
  name: string;
  version: number;
  scope: AIConversationScope;
  content: string;
};

export const promptLibrary: PromptTemplateDefinition[] = [
  {
    key: "learning_coach",
    name: "Learning Coach",
    version: 1,
    scope: "STUDENT",
    content: "Guide the student through today's SKILLCITY journey using ALTT. Be simple, warm, practical, and contextual."
  },
  {
    key: "coding_mentor",
    name: "Coding Mentor",
    version: 1,
    scope: "STUDENT",
    content: "Explain coding concepts step by step. Prefer small examples, checks for understanding, and practical exercises."
  },
  {
    key: "founder_mentor",
    name: "Founder Mentor",
    version: 1,
    scope: "STUDENT",
    content: "Help the learner think like a solo founder: validate ideas, build small, speak plainly, and focus on outcomes."
  },
  {
    key: "reflection_coach",
    name: "Reflection Coach",
    version: 1,
    scope: "STUDENT",
    content: "Use the student's reflections to identify learning patterns, effort, blockers, and one improvement for tomorrow."
  },
  {
    key: "assessment_coach",
    name: "Assessment Coach",
    version: 1,
    scope: "STUDENT",
    content: "Help the student prepare for assessments using concise revision, practice questions, and confidence-building feedback."
  },
  {
    key: "director_planner",
    name: "Director Planner",
    version: 1,
    scope: "DIRECTOR",
    content: "Help the Director plan transformation journeys, ALTT improvements, batches, announcements, assessments, and schedules."
  },
  {
    key: "trainer_assistant",
    name: "Trainer Assistant",
    version: 1,
    scope: "TRAINER",
    content: "Help trainers summarize reflections, review submissions, generate feedback, create quizzes, and suggest follow-up tasks."
  },
  {
    key: "admission_assistant",
    name: "Admission Assistant",
    version: 1,
    scope: "ADMISSION",
    content: "Help the admissions team summarize leads, recommend suitable programs, draft follow-ups, prepare counselling notes, and suggest the next best enrollment action."
  },
  {
    key: "bdm_assistant",
    name: "BDM Assistant",
    version: 1,
    scope: "BDM",
    content: "Help business development users prioritize assigned leads, predict likely conversions from available context, draft follow-ups, and improve referral performance."
  }
];

export function buildSystemPrompt(context: TaraContext, templateKey?: string) {
  const template =
    promptLibrary.find((item) => item.key === templateKey && item.scope === context.scope) ??
    promptLibrary.find((item) => item.scope === context.scope) ??
    promptLibrary[0];

  return [
    "You are Tara AI, the intelligence layer inside SKILLCITY, owned by MIB - MAKE IT BEAUTIFUL LLP.",
    "You are not a generic chatbot. You understand the user's role, current learning journey, ALTT session, progress, submissions, assessments, announcements, and schedule.",
    "Use simple English. Be practical, calm, concise, and encouraging. Do not invent platform records that are not in context.",
    template.content,
    "",
    "Current context:",
    JSON.stringify(context, null, 2)
  ].join("\n");
}

export const studentSuggestions = [
  "Explain today's lesson",
  "Summarize today's activities",
  "Help me complete this project",
  "Review my reflection",
  "Give me another example",
  "Create practice questions",
  "Motivate me",
  "Plan my week",
  "Review my portfolio",
  "Improve my resume",
  "Generate a project description",
  "Improve my GitHub README",
  "Prepare interview questions",
  "Suggest missing skills",
  "Recommend communities",
  "Suggest events",
  "Recommend challenges",
  "Suggest marketplace listings"
];

export const directorSuggestions = [
  "Generate Week 4 activities",
  "Suggest ALTT improvements",
  "Create a coding assignment",
  "Write a motivational announcement",
  "Create a quiz",
  "Generate reflection questions",
  "Recommend struggling students",
  "Draft tomorrow's schedule",
  "Identify placement-ready students",
  "Suggest certification eligibility",
  "Analyze community health",
  "Plan an event",
  "Generate a challenge"
];

export const trainerSuggestions = [
  "Summarize student reflections",
  "Review submissions",
  "Generate feedback",
  "Create a quiz",
  "Suggest follow-up tasks",
  "Generate project feedback",
  "Recommend badges",
  "Recommend students to celebrate"
];

export const admissionSuggestions = [
  "Summarize this lead",
  "Suggest next action",
  "Draft a follow-up email",
  "Recommend a suitable program",
  "Draft counselling notes",
  "Prepare a payment reminder"
];

export const bdmSuggestions = [
  "Prioritize my leads",
  "Suggest follow-ups",
  "Predict likely conversions",
  "Improve my referral pitch",
  "Draft a WhatsApp message",
  "Plan this month's target"
];

export async function ensurePromptTemplates() {
  await Promise.all(
    promptLibrary.map((template) =>
      prisma.promptTemplate.upsert({
        where: { key_version: { key: template.key, version: template.version } },
        update: {
          name: template.name,
          scope: template.scope,
          content: template.content,
          status: "ACTIVE"
        },
        create: {
          key: template.key,
          name: template.name,
          version: template.version,
          scope: template.scope,
          content: template.content
        }
      })
    )
  );
}
