import { PrismaClient } from "@prisma/client";
import { validateV2ProductionEnvironment, V2_DEPARTMENT_HEAD_KEYS, V2_REQUIRED_MIGRATIONS } from "../lib/launch/v2-production";

const environmentIssues = validateV2ProductionEnvironment(process.env);
if (environmentIssues.length > 0) {
  for (const issue of environmentIssues) console.error(`FAIL ${issue.variable}: ${issue.message}`);
  console.error("V2 production verification stopped before database access.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const [migrationRows, roles, assistant] = await Promise.all([
    prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
      SELECT "migration_name", "finished_at", "rolled_back_at"
      FROM "_prisma_migrations"
      WHERE "migration_name" IN (${V2_REQUIRED_MIGRATIONS[0]}, ${V2_REQUIRED_MIGRATIONS[1]}, ${V2_REQUIRED_MIGRATIONS[2]})
    `,
    prisma.role.findMany({
      where: { key: { in: [...V2_DEPARTMENT_HEAD_KEYS] }, deletedAt: null },
      select: { key: true, permissions: { where: { permission: { key: "ai.approve", active: true } }, select: { scope: true } } }
    }),
    prisma.aIAssistant.findUnique({ where: { code: "tara" }, select: { status: true, allowedTools: true } })
  ]);

  const applied = new Set(migrationRows.filter((row) => row.finished_at && !row.rolled_back_at).map((row) => row.migration_name));
  const missingMigrations = V2_REQUIRED_MIGRATIONS.filter((migration) => !applied.has(migration));
  const missingApprovalGrants = V2_DEPARTMENT_HEAD_KEYS.filter((key) => {
    const role = roles.find((item) => item.key === key);
    return !role?.permissions.some((grant) => grant.scope === "ORGANIZATION");
  });
  const assistantReady = assistant?.status === "ACTIVE" && assistant.allowedTools.length > 0;

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    readOnly: true,
    checks: {
      databaseConnected: true,
      requiredMigrationsApplied: missingMigrations.length === 0,
      departmentHeadApprovalGrantsReady: missingApprovalGrants.length === 0,
      siaAssistantReady: assistantReady
    },
    missingMigrations,
    missingApprovalGrants,
    secretsPrinted: false
  }, null, 2));

  if (missingMigrations.length > 0 || missingApprovalGrants.length > 0 || !assistantReady) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`FAIL database verification: ${error instanceof Error ? error.name : "Unknown error"}`);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
