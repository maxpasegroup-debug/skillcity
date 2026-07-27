"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { automationRuleSchema, campusSchema, departmentSchema, employeeSchema, institutionSchema, reportSchema, systemSettingSchema } from "@/features/executive/schemas";
import { requireExecutive } from "@/server/executive/queries";

type State = { ok: boolean; message: string };
function emptyToNull(value?: string) { return value && value.trim() ? value : null; }
function jsonValue(value: string) {
  try { return JSON.parse(value); } catch { return { value }; }
}

export async function createInstitutionAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireExecutive();
  const parsed = institutionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check institution details." };
  const institution = await prisma.institution.create({ data: { name: parsed.data.name, slug: parsed.data.slug, legalName: parsed.data.legalName } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "INSTITUTION_CREATED", entity: "Institution", entityId: institution.id } });
  revalidatePath("/executive/campuses");
  return { ok: true, message: "Institution created." };
}

export async function createCampusAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireExecutive();
  const parsed = campusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check campus details." };
  const campus = await prisma.campus.create({ data: parsed.data });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "CAMPUS_CREATED", entity: "Campus", entityId: campus.id } });
  revalidatePath("/executive/campuses");
  return { ok: true, message: "Campus created." };
}

export async function createDepartmentAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireExecutive();
  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check department details." };
  const department = await prisma.department.create({ data: { ...parsed.data, institutionId: emptyToNull(parsed.data.institutionId), campusId: emptyToNull(parsed.data.campusId) } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "DEPARTMENT_CREATED", entity: "Department", entityId: department.id } });
  revalidatePath("/executive/departments");
  return { ok: true, message: "Department created." };
}

export async function createEmployeeAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireExecutive();
  const parsed = employeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check employee details." };
  const employee = await prisma.employee.upsert({
    where: { userId: parsed.data.userId },
    update: { ...parsed.data, institutionId: emptyToNull(parsed.data.institutionId), campusId: emptyToNull(parsed.data.campusId), departmentId: emptyToNull(parsed.data.departmentId) },
    create: { ...parsed.data, institutionId: emptyToNull(parsed.data.institutionId), campusId: emptyToNull(parsed.data.campusId), departmentId: emptyToNull(parsed.data.departmentId), employeeCode: emptyToNull(parsed.data.employeeCode) }
  });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "EMPLOYEE_UPSERTED", entity: "Employee", entityId: employee.id } });
  revalidatePath("/executive/hr");
  return { ok: true, message: "Employee saved." };
}

export async function createAutomationRuleAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireExecutive();
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
  const report = await prisma.executiveReport.create({ data: { createdById: actor.id, type: parsed.data.type, title: parsed.data.title, summary: parsed.data.summary, payload: { generatedAt: new Date().toISOString(), exportReady: true } } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "EXECUTIVE_REPORT_CREATED", entity: "ExecutiveReport", entityId: report.id } });
  revalidatePath("/executive/reports");
  return { ok: true, message: "Executive report saved." };
}

export async function saveSystemSettingAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireExecutive();
  const parsed = systemSettingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check setting details." };
  const institutionId = emptyToNull(parsed.data.institutionId);
  const existing = await prisma.systemSetting.findFirst({ where: { institutionId, key: parsed.data.key } });
  const setting = existing
    ? await prisma.systemSetting.update({ where: { id: existing.id }, data: { value: jsonValue(parsed.data.value), encrypted: parsed.data.encrypted ?? false } })
    : await prisma.systemSetting.create({ data: { institutionId, key: parsed.data.key, value: jsonValue(parsed.data.value), encrypted: parsed.data.encrypted ?? false } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "SYSTEM_SETTING_SAVED", entity: "SystemSetting", entityId: setting.id } });
  revalidatePath("/executive/system-settings");
  return { ok: true, message: "System setting saved." };
}
