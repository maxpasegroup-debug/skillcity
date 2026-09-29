import { prisma } from "@/lib/prisma";
import { V2_REQUIRED_MIGRATIONS } from "@/lib/launch/v2-production";

const READINESS_TIMEOUT_MS = 4_000;

export async function checkApplicationReadiness() {
  const query = prisma.$queryRaw<Array<{ databaseReady: boolean }>>`
    SELECT
      to_regclass('"User"') IS NOT NULL
      AND to_regclass('"InternalChannel"') IS NOT NULL
      AND to_regclass('"AIActionProposal"') IS NOT NULL
      AND (
        SELECT COUNT(DISTINCT "migration_name")
        FROM "_prisma_migrations"
        WHERE "migration_name" IN (${V2_REQUIRED_MIGRATIONS[0]}, ${V2_REQUIRED_MIGRATIONS[1]}, ${V2_REQUIRED_MIGRATIONS[2]})
          AND "finished_at" IS NOT NULL
          AND "rolled_back_at" IS NULL
      ) = ${V2_REQUIRED_MIGRATIONS.length}
      AS "databaseReady"
  `;
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Readiness check timed out")), READINESS_TIMEOUT_MS);
    timer.unref?.();
  });
  try {
    const rows = await Promise.race([query, timeout]);
    return rows[0]?.databaseReady === true;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
