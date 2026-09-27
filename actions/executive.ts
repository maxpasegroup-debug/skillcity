"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { validateOrganizationPath } from "@/lib/organization/hierarchy";
import { automationRuleSchema, campusSchema, departmentSchema, districtSchema, divisionSchema, institutionSchema, reportSchema, systemSettingSchema } from "@/features/executive/schemas";
import { requireExecutive } from "@/server/executive/queries";
import { PERMISSIONS, resolveAuthorizedScopes } from "@/lib/auth/permissions";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { assertCampusAccess, assertDepartmentAccess, assertDistrictAccess, assertDivisionAccess, assertInstitutionAccess } from "@/server/auth/resource-access";

type State = { ok: boolean; message: string };
function emptyToNull(value?: string) { return value && value.trim() ? value : null; }
function jsonValue(value: string) {
  try { return JSON.parse(value); } catch { return { value }; }
}

function requireGlobalOrganizationAccess(actor: Awaited<ReturnType<typeof assertPermission>>) {
  if (!resolveAuthorizedScopes(actor, PERMISSIONS.ORGANIZATION_MANAGE).global) {
    throw new AuthorizationError("This operation requires global organization access");
  }
}

async function validateOrganizationReferences(actor: Awaited<ReturnType<typeof assertPermission>>, data: {
  institutionId?: string | null;
  districtId?: string | null;
  divisionId?: string | null;
  campusId?: string | null;
  departmentId?: string | null;
}) {
  if (data.institutionId) await assertInstitutionAccess(actor, PERMISSIONS.ORGANIZATION_MANAGE, data.institutionId);
  if (data.districtId) await assertDistrictAccess(actor, PERMISSIONS.ORGANIZATION_MANAGE, data.districtId);
  if (data.divisionId) await assertDivisionAccess(actor, PERMISSIONS.ORGANIZATION_MANAGE, data.divisionId);
  if (data.campusId) await assertCampusAccess(actor, PERMISSIONS.ORGANIZATION_MANAGE, data.campusId);
  if (data.departmentId) await assertDepartmentAccess(actor, PERMISSIONS.ORGANIZATION_MANAGE, data.departmentId);

  const [division, district, campus, department] = await Promise.all([
    data.divisionId ? prisma.division.findUnique({ where: { id: data.divisionId }, select: { id: true, institutionId: true } }) : null,
    data.districtId ? prisma.district.findUnique({ where: { id: data.districtId }, select: { id: true, institutionId: true } }) : null,
    data.campusId ? prisma.campus.findUnique({ where: { id: data.campusId }, select: { id: true, institutionId: true, districtId: true } }) : null,
    data.departmentId ? prisma.department.findUnique({ where: { id: data.departmentId }, select: { id: true, institutionId: true, divisionId: true, campusId: true, division: { select: { institutionId: true } }, campus: { select: { institutionId: true } } } }) : null
  ]);
  const institutionIds = [
    data.institutionId,
    division?.institutionId,
    district?.institutionId,
    campus?.institutionId,
    department?.institutionId,
    department?.division?.institutionId,
    department?.campus?.institutionId
  ].filter((id): id is string => Boolean(id));
  if (new Set(institutionIds).size > 1) throw new AuthorizationError("Organization references must belong to the same organization");
  const institutionId = institutionIds[0];
  if (institutionId) {
    const result = validateOrganizationPath({ ...data, institutionId }, { division, district, campus, department });
    if (!result.valid) throw new AuthorizationError(result.issues.join(" "));
  }
}

export async function createInstitutionAction(_: State, formData: FormData): Promise<State> {
  const actor = await assertPermission(PERMISSIONS.ORGANIZATION_MANAGE);
  requireGlobalOrganizationAccess(actor);
  const parsed = institutionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check institution details." };
  const institution = await prisma.institution.create({ data: { name: parsed.data.name, slug: parsed.data.slug, legalName: parsed.data.legalName } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "INSTITUTION_CREATED", entity: "Institution", entityId: institution.id } });
  revalidatePath("/executive/campuses");
  return { ok: true, message: "Institution created." };
}

export async function createCampusAction(_: State, formData: FormData): Promise<State> {
  const actor = await assertPermission(PERMISSIONS.ORGANIZATION_MANAGE);
  const parsed = campusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check campus details." };
  await validateOrganizationReferences(actor, { institutionId: parsed.data.institutionId, districtId: emptyToNull(parsed.data.districtId) });
  const campus = await prisma.campus.create({ data: { ...parsed.data, districtId: emptyToNull(parsed.data.districtId) } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "CAMPUS_CREATED", entity: "Campus", entityId: campus.id } });
  revalidatePath("/executive/campuses");
  return { ok: true, message: "Campus created." };
}

export async function createDivisionAction(_: State, formData: FormData): Promise<State> {
  const actor = await assertPermission(PERMISSIONS.ORGANIZATION_MANAGE);
  const parsed = divisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check division details." };
  await assertInstitutionAccess(actor, PERMISSIONS.ORGANIZATION_MANAGE, parsed.data.institutionId);
  const division = await prisma.division.create({ data: { ...parsed.data, code: emptyToNull(parsed.data.code) } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "DIVISION_CREATED", entity: "Division", entityId: division.id } });
  revalidatePath("/executive/campuses");
  return { ok: true, message: "Division created." };
}

export async function createDistrictAction(_: State, formData: FormData): Promise<State> {
  const actor = await assertPermission(PERMISSIONS.ORGANIZATION_MANAGE);
  const parsed = districtSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check district details." };
  await assertInstitutionAccess(actor, PERMISSIONS.ORGANIZATION_MANAGE, parsed.data.institutionId);
  const district = await prisma.district.create({ data: { ...parsed.data, stateCode: emptyToNull(parsed.data.stateCode) } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "DISTRICT_CREATED", entity: "District", entityId: district.id } });
  revalidatePath("/executive/campuses");
  return { ok: true, message: "District created." };
}

export async function createDepartmentAction(_: State, formData: FormData): Promise<State> {
  const actor = await assertPermission(PERMISSIONS.ORGANIZATION_MANAGE);
  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check department details." };
  await validateOrganizationReferences(actor, { institutionId: emptyToNull(parsed.data.institutionId), divisionId: emptyToNull(parsed.data.divisionId), campusId: emptyToNull(parsed.data.campusId) });
  const department = await prisma.department.create({ data: { ...parsed.data, institutionId: emptyToNull(parsed.data.institutionId), divisionId: emptyToNull(parsed.data.divisionId), campusId: emptyToNull(parsed.data.campusId) } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "DEPARTMENT_CREATED", entity: "Department", entityId: department.id } });
  revalidatePath("/executive/departments");
  return { ok: true, message: "Department created." };
}

export async function createAutomationRuleAction(_: State, formData: FormData): Promise<State> {
  const actor = await assertPermission(PERMISSIONS.ORGANIZATION_MANAGE);
  requireGlobalOrganizationAccess(actor);
  const parsed = automationRuleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check automation rule." };
  const rule = await prisma.automationRule.create({ data: { name: parsed.data.name, description: parsed.data.description, triggerType: parsed.data.triggerType, actionType: parsed.data.actionType, conditions: jsonValue(parsed.data.conditions), actionConfig: jsonValue(parsed.data.actionConfig), active: parsed.data.active ?? true } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "AUTOMATION_RULE_CREATED", entity: "AutomationRule", entityId: rule.id } });
  revalidatePath("/executive/automation-center");
  return { ok: true, message: "Automation rule created." };
}

export async function createExecutiveReportAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireExecutive();
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check report details." };
  const resolved = resolveAuthorizedScopes(actor, PERMISSIONS.EXECUTIVE_ACCESS);
  const organizationIds = [...new Set(resolved.assignments.map((scope) => scope.institutionId).filter((id): id is string => Boolean(id)))];
  if (!resolved.global && organizationIds.length !== 1) throw new AuthorizationError("A single organization scope is required to create a report");
  const report = await prisma.executiveReport.create({ data: { institutionId: resolved.global ? null : organizationIds[0], createdById: actor.id, type: parsed.data.type, title: parsed.data.title, summary: parsed.data.summary, payload: { generatedAt: new Date().toISOString(), exportReady: true } } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "EXECUTIVE_REPORT_CREATED", entity: "ExecutiveReport", entityId: report.id } });
  revalidatePath("/executive/reports");
  return { ok: true, message: "Executive report saved." };
}

export async function saveSystemSettingAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireExecutive();
  const parsed = systemSettingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check setting details." };
  const institutionId = emptyToNull(parsed.data.institutionId);
  const resolved = resolveAuthorizedScopes(actor, PERMISSIONS.EXECUTIVE_ACCESS);
  if (institutionId) await assertInstitutionAccess(actor, PERMISSIONS.EXECUTIVE_ACCESS, institutionId);
  if (!institutionId && !resolved.global) throw new AuthorizationError("An authorized organization is required for this setting");
  const existing = await prisma.systemSetting.findFirst({ where: { institutionId, key: parsed.data.key } });
  const setting = existing
    ? await prisma.systemSetting.update({ where: { id: existing.id }, data: { value: jsonValue(parsed.data.value), encrypted: parsed.data.encrypted ?? false } })
    : await prisma.systemSetting.create({ data: { institutionId, key: parsed.data.key, value: jsonValue(parsed.data.value), encrypted: parsed.data.encrypted ?? false } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "SYSTEM_SETTING_SAVED", entity: "SystemSetting", entityId: setting.id } });
  revalidatePath("/executive/system-settings");
  return { ok: true, message: "System setting saved." };
}
