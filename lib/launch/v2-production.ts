export const V2_REQUIRED_MIGRATIONS = [
  "20260929000100_remediate_production_blockers",
  "20260929000200_add_v2_internal_communications",
  "20260929000300_add_v2_sia_department_approvals"
] as const;

export const V2_DEPARTMENT_HEAD_KEYS = [
  "PEOPLE_OPERATIONS_HEAD",
  "ADMISSIONS_GROWTH_HEAD",
  "ACADEMIC_HEAD",
  "FINANCE_COMPLIANCE_HEAD",
  "TECHNOLOGY_PRODUCTS_HEAD",
  "CAREER_PARTNERSHIPS_HEAD"
] as const;

export type ProductionEnvironmentIssue = { variable: string; message: string };

function present(value: string | undefined) {
  return Boolean(value?.trim());
}

function validUrl(value: string | undefined, protocol: "https:" | "postgresql:") {
  if (!value?.trim()) return false;
  try {
    return new URL(value).protocol === protocol;
  } catch {
    return false;
  }
}

export function validateV2ProductionEnvironment(environment: NodeJS.ProcessEnv): ProductionEnvironmentIssue[] {
  const issues: ProductionEnvironmentIssue[] = [];
  if (!validUrl(environment.DATABASE_URL, "postgresql:")) issues.push({ variable: "DATABASE_URL", message: "A PostgreSQL connection URL is required." });
  if (!validUrl(environment.NEXT_PUBLIC_APP_URL, "https:")) issues.push({ variable: "NEXT_PUBLIC_APP_URL", message: "The canonical production URL must use HTTPS." });
  if (!present(environment.RESEND_API_KEY)) issues.push({ variable: "RESEND_API_KEY", message: "Email login and recovery require a configured provider." });
  if (!present(environment.OPENAI_API_KEY)) issues.push({ variable: "OPENAI_API_KEY", message: "The SIA conversational assistant requires a configured provider." });

  const privateDocumentValues = [environment.PRIVATE_DOCUMENT_PROVIDER, environment.PRIVATE_DOCUMENT_GATEWAY_URL, environment.PRIVATE_DOCUMENT_SIGNING_SECRET];
  const configuredPrivateDocumentValues = privateDocumentValues.filter(present).length;
  if (configuredPrivateDocumentValues > 0 && configuredPrivateDocumentValues < privateDocumentValues.length) {
    issues.push({ variable: "PRIVATE_DOCUMENT_*", message: "Private document delivery must be fully configured or remain disabled." });
  }
  if (configuredPrivateDocumentValues === privateDocumentValues.length) {
    if (!validUrl(environment.PRIVATE_DOCUMENT_GATEWAY_URL, "https:")) issues.push({ variable: "PRIVATE_DOCUMENT_GATEWAY_URL", message: "The private document gateway must use HTTPS." });
    if ((environment.PRIVATE_DOCUMENT_SIGNING_SECRET?.length ?? 0) < 32) issues.push({ variable: "PRIVATE_DOCUMENT_SIGNING_SECRET", message: "The signing secret must contain at least 32 characters." });
  }
  return issues;
}
