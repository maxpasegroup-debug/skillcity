export const ALTT_STAGES = ["LEARN", "PRACTISE", "BUILD", "DEPLOY", "EARN", "GROW"] as const;
export type AlttStage = (typeof ALTT_STAGES)[number];

type AlttInput = {
  type?: string | null;
  title?: string | null;
  metadata?: unknown;
};

const typeStages: Record<string, AlttStage> = {
  VIDEO: "LEARN",
  LIVE: "LEARN",
  ARTICLE: "LEARN",
  PDF: "LEARN",
  INTERACTIVE_READING: "LEARN",
  VOICE_INSTRUCTION: "LEARN",
  VOICE_NOTE: "LEARN",
  LINK: "LEARN",
  QUIZ: "PRACTISE",
  CODING_PRACTICE: "PRACTISE",
  TASK: "PRACTISE",
  CHECKLIST: "PRACTISE",
  AI_DISCUSSION: "PRACTISE",
  AI_CHAT: "PRACTISE",
  OFFLINE: "PRACTISE",
  PROJECT: "BUILD",
  PROJECT_TASK: "BUILD",
  FILE_UPLOAD: "BUILD",
  SUBMISSION: "BUILD",
  EXTERNAL_LINK: "DEPLOY",
  MEETING: "DEPLOY",
  REFLECTION: "GROW",
  ASSESSMENT: "GROW"
};

export function isAlttStage(value: unknown): value is AlttStage {
  return typeof value === "string" && ALTT_STAGES.includes(value as AlttStage);
}

export function resolveAlttStage(input: AlttInput): AlttStage {
  if (input.metadata && typeof input.metadata === "object" && "alttStage" in input.metadata) {
    const explicit = (input.metadata as { alttStage?: unknown }).alttStage;
    if (isAlttStage(explicit)) return explicit;
  }

  const title = input.title?.trim().toUpperCase();
  const titleStage = ALTT_STAGES.find((stage) => title === stage || title?.startsWith(`${stage} `));
  if (titleStage) return titleStage;
  return typeStages[input.type ?? ""] ?? "LEARN";
}

export function alttStageProgress(items: AlttInput[]) {
  const counts = Object.fromEntries(ALTT_STAGES.map((stage) => [stage, 0])) as Record<AlttStage, number>;
  for (const item of items) counts[resolveAlttStage(item)] += 1;
  return counts;
}
