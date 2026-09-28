export type OrganizationReference = {
  institutionId?: string | null;
  divisionId?: string | null;
  campusId?: string | null;
};

export function normalizeCrmPhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function normalizeCrmEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

export function organizationConflict(left: OrganizationReference, right: OrganizationReference) {
  const keys: Array<keyof OrganizationReference> = ["institutionId", "divisionId", "campusId"];
  return keys.find((key) => left[key] && right[key] && left[key] !== right[key]) ?? null;
}

export function validateAdmissionRelationships(input: {
  application: { leadId: string; programId: string; studentId?: string | null };
  invoice?: { leadId?: string | null; programId?: string | null; status: string } | null;
  batch?: { programId: string; journeyId?: string | null; status: string; capacity?: number | null; enrollmentCount?: number } | null;
  journeyId: string;
}) {
  const issues: string[] = [];
  const { application, invoice, batch, journeyId } = input;

  if (invoice) {
    if (invoice.leadId !== application.leadId) issues.push("Invoice belongs to a different lead.");
    if (invoice.programId !== application.programId) issues.push("Invoice belongs to a different program.");
    if (invoice.status !== "PAID") issues.push("Invoice payment is not verified.");
  }
  if (batch) {
    if (batch.programId !== application.programId) issues.push("Batch belongs to a different program.");
    if (batch.status !== "ACTIVE") issues.push("Batch is not active.");
    if (batch.journeyId && batch.journeyId !== journeyId) issues.push("Batch uses a different learning journey.");
    if (batch.capacity != null && (batch.enrollmentCount ?? 0) >= batch.capacity) issues.push("Batch capacity has been reached.");
  }
  return issues;
}

export function funnelRate(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}
