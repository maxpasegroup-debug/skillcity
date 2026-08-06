import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { launchPrograms } from "../config/launch-programs";

type Check = {
  name: string;
  ok: boolean;
  detail: string;
};

const root = process.cwd();

function file(path: string) {
  return join(root, path);
}

function readJson(path: string) {
  return JSON.parse(readFileSync(file(path), "utf8")) as Record<string, unknown>;
}

function hasScript(packageJson: Record<string, unknown>, script: string) {
  const scripts = packageJson.scripts as Record<string, string> | undefined;
  return Boolean(scripts?.[script]);
}

const packageJson = readJson("package.json");
const railway = readJson("railway.json");
const engines = packageJson.engines as Record<string, string> | undefined;
const migrationsPath = file("prisma/migrations");
const migrationNames = existsSync(migrationsPath) ? readdirSync(migrationsPath).filter((name) => name !== "migration_lock.toml") : [];
const envExample = readFileSync(file(".env.example"), "utf8");

const requiredEnv = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "RESEND_API_KEY",
  "REDIS_URL",
  "NEXT_PUBLIC_APP_URL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL"
];

const checks: Check[] = [
  {
    name: "Node runtime",
    ok: engines?.node === ">=20.9.0",
    detail: "Railway must use Node.js 20.9.0 or newer."
  },
  {
    name: "Railway build command",
    ok: JSON.stringify(railway).includes("npm run build"),
    detail: "Railway builds through the production Next.js build."
  },
  {
    name: "Railway migration startup",
    ok: JSON.stringify(railway).includes("npm run prisma:deploy"),
    detail: "Railway runs Prisma migrations before starting Next.js."
  },
  {
    name: "Launch programs",
    ok: launchPrograms.length === 3 && launchPrograms.some((program) => program.slug === "nicejobs-sales-mastery" && program.isFree),
    detail: "Startup Skool, GenZ Builder and NiceJobs Sales Mastery are configured."
  },
  {
    name: "Prisma migrations",
    ok: migrationNames.some((name) => name.includes("add_admission_program_fields")) && migrationNames.some((name) => name.includes("add_whatsapp_pin_login")),
    detail: "Admissions program fields and WhatsApp PIN login migrations exist."
  },
  {
    name: "Required env example",
    ok: requiredEnv.every((name) => envExample.includes(name)),
    detail: "All required Railway variables are documented in .env.example."
  },
  {
    name: "Verification scripts",
    ok: ["lint", "typecheck", "prisma:validate", "build", "db:seed"].every((script) => hasScript(packageJson, script)),
    detail: "Local and deployment verification scripts are present."
  }
];

let failed = 0;
for (const check of checks) {
  const mark = check.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${check.name}: ${check.detail}`);
  if (!check.ok) failed += 1;
}

if (failed > 0) {
  console.error(`Launch readiness failed with ${failed} issue${failed === 1 ? "" : "s"}.`);
  process.exit(1);
}

console.log("PASS Launch readiness: AIRA Skill City admissions launch checks passed.");
