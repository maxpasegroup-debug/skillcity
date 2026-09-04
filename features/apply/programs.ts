import { Bot, BrainCircuit, LineChart, Rocket } from "lucide-react";
import { getLaunchProgram, launchPrograms, type LaunchProgramSlug } from "@/config/launch-programs";

const launchProgramIcons = {
  "startup-skool": Rocket,
  "aira-labs": BrainCircuit,
  "genz-builder": Bot,
  "nicejobs-sales-mastery": LineChart
} satisfies Record<LaunchProgramSlug, typeof Rocket>;

export const launchApplicationPrograms = launchPrograms.map((program) => ({
  ...program,
  icon: launchProgramIcons[program.slug]
}));

export const nexaProgramOptions = launchApplicationPrograms.filter((program) => program.slug === "startup-skool" || program.slug === "aira-labs");

export type LaunchApplicationProgramSlug = (typeof launchApplicationPrograms)[number]["slug"];

export function getLaunchApplicationProgram(slug: string | undefined) {
  const program = getLaunchProgram(slug);
  return launchApplicationPrograms.find((item) => item.slug === program.slug) ?? launchApplicationPrograms[0];
}
