import { PrismaClient } from "@prisma/client";
import { LEGACY_ROLE_GRANTS, ROLE_NAME_TO_KEY } from "../lib/auth/permissions";
import { V2_ROLE_DEFINITIONS } from "../lib/auth/v2-governance";

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      permissions: { include: { permission: { select: { key: true, active: true } } } },
      _count: { select: { users: true } }
    }
  });
  const expectedV2Keys = new Set<string>(V2_ROLE_DEFINITIONS.map((role) => role.key));
  const presentKeys = new Set<string>(roles.map((role) => role.key ?? ROLE_NAME_TO_KEY[role.name]).filter((key): key is string => Boolean(key)));

  const roleAudit = roles.map((role) => {
    const key = role.key ?? ROLE_NAME_TO_KEY[role.name] ?? null;
    const expected = key ? LEGACY_ROLE_GRANTS[key] ?? [] : [];
    const actual = new Map(role.permissions.filter((grant) => grant.permission.active).map((grant) => [grant.permission.key, grant.scope]));
    return {
      name: role.name,
      key,
      users: role._count.users,
      v2: Boolean(key && expectedV2Keys.has(key)),
      missingPermissions: expected.filter((grant) => !actual.has(grant.permission)).map((grant) => grant.permission),
      unexpectedPermissions: [...actual.keys()].filter((permission) => !expected.some((grant) => grant.permission === permission))
    };
  });

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    readOnly: true,
    roles: roleAudit,
    missingV2Roles: V2_ROLE_DEFINITIONS.filter((role) => !presentKeys.has(role.key)).map((role) => ({ key: role.key, name: role.name })),
    manualReviewRequired: roleAudit.filter((role) => role.unexpectedPermissions.length > 0 || role.users > 0 && !role.key)
  }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : "V2 role governance audit failed");
  await prisma.$disconnect();
  process.exit(1);
});
