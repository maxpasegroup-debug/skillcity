-- Add the public AIRA Labs member role without changing existing users or internal Labs access.
INSERT INTO "Role" ("id", "name", "key", "system", "description", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'AIRA Labs Member', 'LABS_MEMBER', true, 'Verified personal account for AIRA Labs applications and enquiries.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET
  "key" = EXCLUDED."key",
  "system" = true,
  "deletedAt" = NULL,
  "description" = EXCLUDED."description",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Permission" ("id", "key", "resource", "action", "description", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'labs.portal.access', 'labs.portal', 'access', 'Access the account owner''s AIRA Labs portal.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
  "active" = true,
  "description" = EXCLUDED."description",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", 'OWN'::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Role" role_record
CROSS JOIN "Permission" permission_record
WHERE role_record."key" = 'LABS_MEMBER'
  AND permission_record."key" = 'labs.portal.access'
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET
  "scope" = EXCLUDED."scope",
  "updatedAt" = CURRENT_TIMESTAMP;
