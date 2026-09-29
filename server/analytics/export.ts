import type { ExecutiveIntelligence } from "@/server/analytics/queries";

function cell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function executiveMetricsCsv(data: ExecutiveIntelligence) {
  const rows: Array<[string, string | number | null, string]> = [
    ["admissions.leads", data.admissions.leads, "count"],
    ["admissions.applications", data.admissions.applications, "count"],
    ["admissions.period_application_ratio", data.admissions.conversionPercent, "percent"],
    ["learning.active_enrollments", data.learning.activeEnrollments, "count"],
    ["labs.active_products", data.labs.activeProducts, "count"],
    ["career.open_opportunities", data.career.openOpportunities, "count"],
    ["people.active_employees", data.people.activeEmployees, "count"],
    ["operations.failed_communications", data.operations.communicationFailed, "count"],
    ["operations.failed_automations", data.operations.automationFailed, "count"],
    ["ai.requests", data.ai.requests, "count"],
    ...data.finance.currencies.flatMap((summary): Array<[string, string | number | null, string]> => [
      [`finance.${summary.currency ?? "missing"}.invoiced`, summary.currency ? summary.invoiced : null, summary.currency ?? "normalization-required"],
      [`finance.${summary.currency ?? "missing"}.outstanding`, summary.currency ? summary.outstanding : null, summary.currency ?? "normalization-required"],
      [`finance.${summary.currency ?? "missing"}.paid`, summary.currency ? summary.paid : null, summary.currency ?? "normalization-required"]
    ])
  ];
  return ["metric_code,value,unit,period,time_zone", ...rows.map(([code, value, unit]) => [code, value, unit, data.range.period, data.range.timeZone].map(cell).join(","))].join("\n");
}
