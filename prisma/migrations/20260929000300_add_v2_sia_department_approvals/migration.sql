-- Department heads may review SIA proposals only within their existing organization scope.
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "scope", "createdAt", "updatedAt")
SELECT gen_random_uuid(), role_record."id", permission_record."id", 'ORGANIZATION'::"AccessScopeType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Role" role_record
CROSS JOIN "Permission" permission_record
WHERE role_record."key" IN (
  'PEOPLE_OPERATIONS_HEAD',
  'ADMISSIONS_GROWTH_HEAD',
  'ACADEMIC_HEAD',
  'FINANCE_COMPLIANCE_HEAD',
  'TECHNOLOGY_PRODUCTS_HEAD',
  'CAREER_PARTNERSHIPS_HEAD'
)
AND permission_record."key" = 'ai.approve'
ON CONFLICT ("roleId", "permissionId") DO UPDATE SET
  "scope" = EXCLUDED."scope",
  "updatedAt" = CURRENT_TIMESTAMP;
