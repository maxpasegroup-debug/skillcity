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
const proxySource = readFileSync(file("proxy.ts"), "utf8");

const documentedEnv = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "RESEND_API_KEY",
  "REDIS_URL",
  "NEXT_PUBLIC_APP_URL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_RESPONSES_URL",
  "AI_PROVIDER_TIMEOUT_MS",
  "ANALYTICS_TIME_ZONE",
  "PRIVATE_DOCUMENT_PROVIDER",
  "PRIVATE_DOCUMENT_GATEWAY_URL",
  "PRIVATE_DOCUMENT_SIGNING_SECRET"
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
    name: "Railway migration gate",
    ok: !JSON.stringify(railway).includes("npm run prisma:deploy"),
    detail: "Railway starts Next.js without automatically applying production migrations."
  },
  {
    name: "Railway database health gate",
    ok: JSON.stringify(railway).includes('"healthcheckPath":"/api/health"') || JSON.stringify(railway).includes('"healthcheckPath": "/api/health"'),
    detail: "Railway activates a deployment only after the application and required database migrations are ready."
  },
  {
    name: "Launch programs",
    ok:
      launchPrograms.some((program) => program.slug === "startup-skool" && !program.isFree) &&
      launchPrograms.some((program) => program.slug === "aira-labs" && !program.isFree) &&
      launchPrograms.some((program) => program.slug === "nicejobs-sales-mastery" && program.isFree),
    detail: "Startup Skool, AIRA Labs and NiceJobs Sales Mastery are configured."
  },
  {
    name: "Prisma migrations",
    ok: ["20260929000100_remediate_production_blockers", "20260929000200_add_v2_internal_communications", "20260929000300_add_v2_sia_department_approvals"].every((name) => migrationNames.includes(name)),
    detail: "Production remediation, V2 communications and scoped SIA approval migrations exist."
  },
  {
    name: "Required env example",
    ok: documentedEnv.every((name) => envExample.includes(name)),
    detail: "All runtime environment variables are documented in .env.example."
  },
  {
    name: "Verification scripts",
    ok: ["lint", "typecheck", "test", "prisma:validate", "build", "db:seed", "audit:v2-governance", "audit:v2-communications", "audit:v2-sia", "launch:v2:verify"].every((script) => hasScript(packageJson, script)),
    detail: "Static, database inventory and V2 production verification scripts are present."
  },
  {
    name: "V2 application surfaces",
    ok: ["app/workspace/page.tsx", "app/advisor/dashboard/page.tsx", "app/communications/channels/page.tsx", "app/sia/page.tsx", "app/api/health/route.ts"].every((path) => existsSync(file(path))),
    detail: "Workspace, Advisor, Internal Channels, SIA and health routes exist."
  },
  {
    name: "Production transport header",
    ok: proxySource.includes("Strict-Transport-Security") && proxySource.includes('process.env.NODE_ENV === "production"'),
    detail: "Production responses request HSTS while local HTTP remains usable."
  },
  {
    name: "V2 operator documentation",
    ok: ["docs/production/AIRA_V2_PRODUCTION_RELEASE_RUNBOOK.md", "AIRA_SKILL_CITY_V2_PHASE_5_REPORT.md"].every((path) => existsSync(file(path))),
    detail: "The controlled V2 release and evidence process is documented."
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

console.log("PASS Launch readiness: AIRA Skill City V2 static release checks passed.");
