import { hasPermission, PERMISSIONS, ROLE_KEYS, ROLE_NAME_TO_KEY, type AuthorizationUser, type PermissionKey } from "@/lib/auth/permissions";

export const V2_ROLE_DEFINITIONS = [
  { key: ROLE_KEYS.CEO, name: "CEO", level: "LEADERSHIP" },
  { key: ROLE_KEYS.DIRECTOR, name: "Director", level: "LEADERSHIP" },
  { key: ROLE_KEYS.PEOPLE_OPERATIONS_HEAD, name: "People & Operations Head", level: "DEPARTMENT_HEAD" },
  { key: ROLE_KEYS.ADMISSIONS_GROWTH_HEAD, name: "Admissions & Growth Head", level: "DEPARTMENT_HEAD" },
  { key: ROLE_KEYS.ACADEMIC_HEAD, name: "Academic Head", level: "DEPARTMENT_HEAD" },
  { key: ROLE_KEYS.FINANCE_COMPLIANCE_HEAD, name: "Finance & Compliance Head", level: "DEPARTMENT_HEAD" },
  { key: ROLE_KEYS.TECHNOLOGY_PRODUCTS_HEAD, name: "Technology & Products Head", level: "DEPARTMENT_HEAD" },
  { key: ROLE_KEYS.CAREER_PARTNERSHIPS_HEAD, name: "Career & Partnerships Head", level: "DEPARTMENT_HEAD" },
  { key: ROLE_KEYS.HR_OPERATIONS, name: "HR & Operations Executive", level: "EXECUTION" },
  { key: ROLE_KEYS.HUB_COORDINATOR, name: "Hub Coordinator", level: "EXECUTION" },
  { key: ROLE_KEYS.ADMISSION_OFFICER, name: "Admission Officer", level: "EXECUTION" },
  { key: ROLE_KEYS.BUSINESS_DEVELOPMENT, name: "Business Development", level: "EXECUTION" },
  { key: ROLE_KEYS.COUNSELLOR, name: "Counsellor", level: "EXECUTION" },
  { key: ROLE_KEYS.TELECALLER, name: "Telecaller", level: "EXECUTION" },
  { key: ROLE_KEYS.ACADEMIC_ADVISOR, name: "Academic Advisor", level: "EXECUTION" },
  { key: ROLE_KEYS.TRAINER, name: "Trainer", level: "EXECUTION" },
  { key: ROLE_KEYS.MENTOR, name: "Mentor", level: "EXECUTION" },
  { key: ROLE_KEYS.FINANCE_EXECUTIVE, name: "Finance Executive", level: "EXECUTION" },
  { key: ROLE_KEYS.MARKETING_COMMUNICATIONS, name: "Marketing & Communications Executive", level: "EXECUTION" },
  { key: ROLE_KEYS.PRODUCT_CONTRIBUTOR, name: "Product Contributor", level: "EXECUTION" },
  { key: ROLE_KEYS.LABS_MEMBER, name: "AIRA Labs Member", level: "PARTICIPANT" },
  { key: ROLE_KEYS.CAREER_OPERATIONS, name: "Career Operations", level: "EXECUTION" },
  { key: ROLE_KEYS.PLATFORM_ADMIN, name: "Platform Administrator", level: "PLATFORM" },
  { key: ROLE_KEYS.STUDENT, name: "Student", level: "PARTICIPANT" }
] as const;

export const V2_DESIGNATIONS = [
  ["CEO", "Chief Executive Officer"],
  ["DIRECTOR", "Director"],
  ["PEOPLE_OPERATIONS_HEAD", "People & Operations Head"],
  ["ADMISSIONS_GROWTH_HEAD", "Admissions & Growth Head"],
  ["ACADEMIC_HEAD", "Academic Head"],
  ["FINANCE_COMPLIANCE_HEAD", "Finance & Compliance Head"],
  ["TECHNOLOGY_PRODUCTS_HEAD", "Technology & Products Head"],
  ["CAREER_PARTNERSHIPS_HEAD", "Career & Partnerships Head"],
  ["HR_OPERATIONS_EXECUTIVE", "HR & Operations Executive"],
  ["HUB_COORDINATOR", "Hub Coordinator"],
  ["ADMISSION_OFFICER", "Admission Officer"],
  ["BUSINESS_DEVELOPMENT_EXECUTIVE", "Business Development Executive"],
  ["COUNSELLOR", "Counsellor"],
  ["TELECALLER", "Telecaller"],
  ["SENIOR_ACADEMIC_ADVISOR", "Senior Academic Advisor"],
  ["JUNIOR_ACADEMIC_ADVISOR", "Junior Academic Advisor"],
  ["LEAD_TRAINER", "Lead Trainer"],
  ["TRAINER", "Trainer"],
  ["MENTOR", "Mentor"],
  ["FINANCE_EXECUTIVE", "Finance Executive"],
  ["MARKETING_COMMUNICATIONS_EXECUTIVE", "Marketing & Communications Executive"],
  ["PRODUCT_OWNER", "Product Owner"],
  ["SOFTWARE_DEVELOPER", "Software Developer"],
  ["CAREER_ADVISOR", "Career Advisor"],
  ["PLACEMENT_OFFICER", "Placement Officer"],
  ["EMPLOYER_RELATIONS_EXECUTIVE", "Employer Relations Executive"],
  ["PLATFORM_ADMINISTRATOR", "Platform Administrator"]
] as const;

export type V2WorkspaceKey =
  | "CEO"
  | "DIRECTOR"
  | "PEOPLE"
  | "ADMISSIONS"
  | "ACADEMIC"
  | "ADVISOR"
  | "TRAINER"
  | "GROWTH"
  | "COUNSELLING"
  | "TELECALLING"
  | "HUB"
  | "COMMUNICATIONS"
  | "FINANCE"
  | "TECHNOLOGY"
  | "LABS_PORTAL"
  | "CAREER"
  | "PLATFORM"
  | "EMPLOYEE"
  | "STUDENT";

type WorkspaceDefinition = {
  key: V2WorkspaceKey;
  label: string;
  href: string;
  roleKeys?: readonly string[];
  anyPermissions?: readonly PermissionKey[];
  employeeFallback?: boolean;
};

export const V2_WORKSPACES: readonly WorkspaceDefinition[] = [
  { key: "CEO", label: "CEO Command Centre", href: "/executive/dashboard", roleKeys: [ROLE_KEYS.CEO] },
  { key: "DIRECTOR", label: "Director Operations", href: "/director/dashboard", roleKeys: [ROLE_KEYS.DIRECTOR] },
  { key: "PEOPLE", label: "People & Operations", href: "/employees", roleKeys: [ROLE_KEYS.PEOPLE_OPERATIONS_HEAD, ROLE_KEYS.HR_OPERATIONS, ROLE_KEYS.HR_MANAGER, ROLE_KEYS.HR_EXECUTIVE], anyPermissions: [PERMISSIONS.EMPLOYEE_READ] },
  { key: "ADMISSIONS", label: "Admissions & Growth", href: "/admissions/dashboard", roleKeys: [ROLE_KEYS.ADMISSIONS_GROWTH_HEAD, ROLE_KEYS.ADMISSION_OFFICER, ROLE_KEYS.ADMISSION], anyPermissions: [PERMISSIONS.ADMISSIONS_ACCESS] },
  { key: "ACADEMIC", label: "Academic Operations", href: "/director/dashboard", roleKeys: [ROLE_KEYS.ACADEMIC_HEAD], anyPermissions: [PERMISSIONS.DIRECTOR_ACCESS] },
  { key: "ADVISOR", label: "Academic Advisor", href: "/advisor/dashboard", roleKeys: [ROLE_KEYS.ACADEMIC_ADVISOR], anyPermissions: [PERMISSIONS.ADVISOR_READ] },
  { key: "TRAINER", label: "Trainer", href: "/trainer/dashboard", roleKeys: [ROLE_KEYS.TRAINER, ROLE_KEYS.MENTOR], anyPermissions: [PERMISSIONS.TRAINER_ACCESS] },
  { key: "GROWTH", label: "Growth & Relationships", href: "/bdm/dashboard", roleKeys: [ROLE_KEYS.BUSINESS_DEVELOPMENT, ROLE_KEYS.RELATIONSHIP_MANAGER], anyPermissions: [PERMISSIONS.BDM_ACCESS] },
  { key: "COUNSELLING", label: "Counselling", href: "/counsellor", roleKeys: [ROLE_KEYS.COUNSELLOR], anyPermissions: [PERMISSIONS.COUNSELLOR_ACCESS] },
  { key: "TELECALLING", label: "Telecalling", href: "/telecaller", roleKeys: [ROLE_KEYS.TELECALLER], anyPermissions: [PERMISSIONS.TELECALLER_ACCESS] },
  { key: "HUB", label: "Hub Operations", href: "/admissions/dashboard", roleKeys: [ROLE_KEYS.HUB_COORDINATOR] },
  { key: "COMMUNICATIONS", label: "Team Communications", href: "/communications/channels", roleKeys: [ROLE_KEYS.MARKETING_COMMUNICATIONS, ROLE_KEYS.COMMUNICATIONS_MANAGER], anyPermissions: [PERMISSIONS.INTERNAL_COMMUNICATIONS_READ] },
  { key: "FINANCE", label: "Finance & Compliance", href: "/finance", roleKeys: [ROLE_KEYS.FINANCE_COMPLIANCE_HEAD, ROLE_KEYS.FINANCE_EXECUTIVE, ROLE_KEYS.FINANCE_MANAGER], anyPermissions: [PERMISSIONS.FINANCE_READ] },
  { key: "TECHNOLOGY", label: "Technology & Products", href: "/labs", roleKeys: [ROLE_KEYS.TECHNOLOGY_PRODUCTS_HEAD, ROLE_KEYS.PRODUCT_CONTRIBUTOR], anyPermissions: [PERMISSIONS.LABS_READ] },
  { key: "LABS_PORTAL", label: "AIRA Labs", href: "/aira-labs/dashboard", roleKeys: [ROLE_KEYS.LABS_MEMBER], anyPermissions: [PERMISSIONS.LABS_PORTAL_ACCESS] },
  { key: "CAREER", label: "Career & Partnerships", href: "/career/manage", roleKeys: [ROLE_KEYS.CAREER_PARTNERSHIPS_HEAD, ROLE_KEYS.CAREER_OPERATIONS, ROLE_KEYS.CAREER_HUB_MANAGER], anyPermissions: [PERMISSIONS.CAREER_APPLICATION_MANAGE] },
  { key: "PLATFORM", label: "Platform Administration", href: "/admin/dashboard", roleKeys: [ROLE_KEYS.PLATFORM_ADMIN, ROLE_KEYS.ADMIN], anyPermissions: [PERMISSIONS.ADMIN_ACCESS] },
  { key: "STUDENT", label: "Student", href: "/dashboard", roleKeys: [ROLE_KEYS.STUDENT], anyPermissions: [PERMISSIONS.STUDENT_ACCESS] },
  { key: "EMPLOYEE", label: "Employee My Work", href: "/notifications", employeeFallback: true }
];

const protectedRoleKeys = new Set<string>([ROLE_KEYS.CEO, ROLE_KEYS.DIRECTOR, ROLE_KEYS.PLATFORM_ADMIN, ROLE_KEYS.ADMIN]);
const v2RoleKeys = new Set<string>(V2_ROLE_DEFINITIONS.map((role) => role.key));

export function authorizationRoleKeys(user: AuthorizationUser) {
  return new Set((user.roles ?? []).map(({ role }) => role.key ?? ROLE_NAME_TO_KEY[role.name]).filter((key): key is string => Boolean(key)));
}

export function availableV2Workspaces(user: AuthorizationUser) {
  const roleKeys = authorizationRoleKeys(user);
  return V2_WORKSPACES.filter((workspace) => {
    if (workspace.roleKeys?.some((key) => roleKeys.has(key))) return true;
    if (workspace.anyPermissions?.some((permission) => hasPermission(user, permission))) return true;
    return Boolean(workspace.employeeFallback && user.employeeProfile);
  });
}

export function resolveDefaultV2Workspace(user: AuthorizationUser) {
  const available = availableV2Workspaces(user);
  const roleKeys = authorizationRoleKeys(user);
  return available.find((workspace) => workspace.roleKeys?.some((key) => roleKeys.has(key))) ?? available[0] ?? null;
}

export function resolveSiaEntryPoint(user: AuthorizationUser) {
  if (hasPermission(user, PERMISSIONS.AI_USE)) return { href: "/sia", label: "Open SIA Operating Centre" };
  return resolveConversationalAssistantEntryPoint(user);
}

export function resolveConversationalAssistantEntryPoint(user: AuthorizationUser) {
  if (hasPermission(user, PERMISSIONS.AI_DIRECTOR)) {
    return authorizationRoleKeys(user).has(ROLE_KEYS.CEO)
      ? { href: "/executive/ai-command-center", label: "Open SIA Executive Assistant" }
      : { href: "/director/tara", label: "Open SIA Academic Assistant" };
  }
  if (hasPermission(user, PERMISSIONS.AI_ADMISSION)) return { href: "/admissions/tara", label: "Open SIA Admissions Assistant" };
  if (hasPermission(user, PERMISSIONS.AI_TRAINER)) return { href: "/trainer/tara", label: "Open SIA Trainer Assistant" };
  if (hasPermission(user, PERMISSIONS.AI_BDM)) return { href: "/bdm/tara", label: "Open SIA Growth Assistant" };
  if (hasPermission(user, PERMISSIONS.AI_STUDENT)) return { href: "/tara", label: "Open Student Assistant" };
  return null;
}

export function canAssignV2Role(actor: AuthorizationUser, targetRoleKey: string) {
  if (!hasPermission(actor, PERMISSIONS.USER_MANAGE)) return false;
  if (authorizationRoleKeys(actor).has(ROLE_KEYS.CEO)) return true;
  return v2RoleKeys.has(targetRoleKey) && !protectedRoleKeys.has(targetRoleKey);
}

export const SIA_GOVERNANCE = {
  identityType: "AI_ASSISTANT",
  mayReadOnlyWithinActorScope: true,
  mayDraft: true,
  mayPropose: true,
  mayExecutePrivilegedMutation: false,
  humanApprovalRequired: true,
  auditable: true
} as const;
