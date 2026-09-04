export const launchPrograms = [
  {
    slug: "startup-skool",
    title: "Startup Skool",
    shortTitle: "Startup Skool",
    description: "For founders and builders who want to learn, build and launch.",
    category: "Entrepreneurship",
    durationDays: 180,
    displayOrder: 1,
    feeLabel: "Paid program",
    isFree: false
  },
  {
    slug: "aira-labs",
    title: "AIRA Labs - AI Product Engineering",
    shortTitle: "AIRA Labs",
    description: "A selective AI research and product engineering pathway for building revenue-generating AI business models.",
    category: "AI Research",
    durationDays: 365,
    displayOrder: 2,
    feeLabel: "Interview selection",
    isFree: false
  },
  {
    slug: "genz-builder",
    title: "GenZ Builder - Vibe Coding",
    shortTitle: "GenZ Builder",
    description: "For students who want practical AI, full stack creation and vibe coding skills.",
    category: "AI Skills",
    durationDays: 180,
    displayOrder: 3,
    feeLabel: "Paid program",
    isFree: false
  },
  {
    slug: "nicejobs-sales-mastery",
    title: "NiceJobs - Sales Mastery Program",
    shortTitle: "NiceJobs",
    description: "Free internship pathway for practical sales, communication and career readiness.",
    category: "Internship",
    durationDays: 60,
    displayOrder: 4,
    feeLabel: "Free internship",
    isFree: true
  }
] as const;

export type LaunchProgramSlug = (typeof launchPrograms)[number]["slug"];

export function getLaunchProgram(slug: string | undefined) {
  return launchPrograms.find((program) => program.slug === slug) ?? launchPrograms[0];
}
