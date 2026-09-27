import { PrismaClient } from "@prisma/client";
import { launchPrograms } from "../config/launch-programs";
import { platformRoles } from "../types/auth";
import { LEGACY_ROLE_GRANTS, PERMISSIONS, ROLE_NAME_TO_KEY } from "../lib/auth/permissions";

const prisma = new PrismaClient();

const admissionPipelineStages = [
  "New Lead", "Contacted", "Interested", "Counselling Scheduled", "Demo Attended",
  "Application Submitted", "Documents Verified", "Payment Pending", "Payment Verification Pending",
  "Enrolled", "Batch Assigned", "Active Student", "Counselling Completed", "Qualified",
  "Application Started", "Payment Confirmed", "Admission Confirmed", "Account Created",
  "Onboarding", "Batch Assignment Pending", "Not Interested", "Not Qualified", "Withdrawn", "On Hold"
];

const designations = [
  ["CEO", "Chief Executive Officer"],
  ["COO", "Chief Operating Officer"],
  ["DIRECTOR", "Director"],
  ["DEPARTMENT_HEAD", "Department Head"],
  ["HR_MANAGER", "HR Manager"],
  ["HR_EXECUTIVE", "HR Executive"],
  ["ACADEMIC_ADVISOR", "Academic Advisor"],
  ["TRAINER", "Trainer"],
  ["RELATIONSHIP_MANAGER", "Relationship Manager"],
  ["BUSINESS_DEVELOPMENT_EXECUTIVE", "Business Development Executive"],
  ["COUNSELLOR", "Counsellor"],
  ["TELECALLER", "Telecaller"]
] as const;

async function main() {
  const roleIds = new Map<string, string>();
  for (const name of platformRoles) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { key: ROLE_NAME_TO_KEY[name], system: true },
      create: { name, key: ROLE_NAME_TO_KEY[name], system: true }
    });
    roleIds.set(name, role.id);
  }

  const permissionIds = new Map<string, string>();
  for (const key of Object.values(PERMISSIONS)) {
    const [resource, action] = key.split(".");
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { resource, action, active: true },
      create: { key, resource, action }
    });
    permissionIds.set(key, permission.id);
  }

  for (const name of platformRoles) {
    const roleKey = ROLE_NAME_TO_KEY[name];
    const roleId = roleIds.get(name);
    if (!roleId || !roleKey) continue;
    const grants = [...(LEGACY_ROLE_GRANTS[roleKey] ?? [])];
    if (!grants.some((grant) => grant.permission === PERMISSIONS.COMMUNITY_ACCESS)) {
      grants.push({ permission: PERMISSIONS.COMMUNITY_ACCESS, scope: "OWN" });
    }
    for (const grant of grants) {
      const permissionId = permissionIds.get(grant.permission);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: { scope: grant.scope },
        create: { roleId, permissionId, scope: grant.scope }
      });
    }
  }

  for (const [key, name] of designations) {
    await prisma.designation.upsert({
      where: { key },
      update: { name, active: true },
      create: { key, name }
    });
  }

  const existingStages = await prisma.pipelineStage.findMany({ select: { slug: true, order: true } });
  const existingBySlug = new Map(existingStages.map((stage) => [stage.slug, stage]));
  let nextStageOrder = existingStages.reduce((max, stage) => Math.max(max, stage.order), 0) + 1;
  for (const name of admissionPipelineStages) {
    const slug = name.toLowerCase().replaceAll(" ", "-");
    const existing = existingBySlug.get(slug);
    if (existing) {
      await prisma.pipelineStage.update({ where: { slug }, data: { name, active: true } });
    } else {
      await prisma.pipelineStage.create({ data: { name, slug, order: nextStageOrder++ } });
    }
  }
  await prisma.leadSource.upsert({ where: { name: "Website" }, update: {}, create: { name: "Website" } });

  for (const program of launchPrograms) {
    await prisma.program.upsert({
      where: { slug: program.slug },
      update: {
        name: program.title,
        description: program.description,
        durationDays: program.durationDays,
        status: "ACTIVE",
        category: program.category,
        feeType: program.isFree ? "FREE" : "PAID",
        admissionStatus: "OPEN",
        displayOrder: program.displayOrder,
        publicVisible: true
      },
      create: {
        name: program.title,
        slug: program.slug,
        description: program.description,
        durationDays: program.durationDays,
        status: "ACTIVE",
        category: program.category,
        feeType: program.isFree ? "FREE" : "PAID",
        admissionStatus: "OPEN",
        displayOrder: program.displayOrder,
        publicVisible: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
