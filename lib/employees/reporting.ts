export type ReportingLine = { id: string; managerId: string | null };

export function managerBelongsToOrganization(institutionId: string | null, assignmentInstitutionIds: string[], employeeInstitutionId: string) {
  return institutionId === employeeInstitutionId || assignmentInstitutionIds.includes(employeeInstitutionId);
}

export function reportingLineCreatesCycle(employeeId: string, managerId: string | null, employees: ReportingLine[]) {
  if (!managerId) return false;
  const managerByEmployee = new Map(employees.map((employee) => [employee.id, employee.managerId]));
  const visited = new Set<string>();
  let currentId: string | null = managerId;

  while (currentId) {
    if (currentId === employeeId) return true;
    if (visited.has(currentId)) return true;
    visited.add(currentId);
    currentId = managerByEmployee.get(currentId) ?? null;
  }
  return false;
}
