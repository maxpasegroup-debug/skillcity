export const ANALYTICS_PERIODS = ["TODAY", "THIS_WEEK", "THIS_MONTH", "THIS_QUARTER", "THIS_YEAR"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export type AnalyticsRange = {
  period: AnalyticsPeriod;
  label: string;
  timeZone: string;
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
};

type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsAt(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function zonedDateTimeToUtc(parts: DateParts, timeZone: string) {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let candidate = new Date(target);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const actual = partsAt(candidate, timeZone);
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    candidate = new Date(candidate.getTime() + target - actualAsUtc);
  }
  return candidate;
}

function calendarStart(now: Date, period: AnalyticsPeriod, timeZone: string) {
  const local = partsAt(now, timeZone);
  let { year, month, day } = local;
  if (period === "THIS_YEAR") { month = 1; day = 1; }
  if (period === "THIS_QUARTER") { month = Math.floor((month - 1) / 3) * 3 + 1; day = 1; }
  if (period === "THIS_MONTH") day = 1;
  if (period === "THIS_WEEK") {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    const shifted = new Date(Date.UTC(year, month - 1, day + mondayOffset));
    year = shifted.getUTCFullYear(); month = shifted.getUTCMonth() + 1; day = shifted.getUTCDate();
  }
  return zonedDateTimeToUtc({ year, month, day, hour: 0, minute: 0, second: 0 }, timeZone);
}

function shiftPeriod(start: Date, period: AnalyticsPeriod, amount: number, timeZone: string) {
  const local = partsAt(start, timeZone);
  const shifted = new Date(Date.UTC(local.year, local.month - 1, local.day));
  if (period === "TODAY") shifted.setUTCDate(shifted.getUTCDate() + amount);
  if (period === "THIS_WEEK") shifted.setUTCDate(shifted.getUTCDate() + 7 * amount);
  if (period === "THIS_MONTH") shifted.setUTCMonth(shifted.getUTCMonth() + amount);
  if (period === "THIS_QUARTER") shifted.setUTCMonth(shifted.getUTCMonth() + 3 * amount);
  if (period === "THIS_YEAR") shifted.setUTCFullYear(shifted.getUTCFullYear() + amount);
  return zonedDateTimeToUtc({ year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate(), hour: 0, minute: 0, second: 0 }, timeZone);
}

export function normalizeAnalyticsPeriod(value?: string): AnalyticsPeriod {
  return ANALYTICS_PERIODS.includes(value as AnalyticsPeriod) ? value as AnalyticsPeriod : "THIS_MONTH";
}

export function resolveAnalyticsRange(periodInput?: string, now = new Date(), timeZone = process.env.ANALYTICS_TIME_ZONE || "Asia/Kolkata"): AnalyticsRange {
  const period = normalizeAnalyticsPeriod(periodInput);
  const start = calendarStart(now, period, timeZone);
  const previousStart = shiftPeriod(start, period, -1, timeZone);
  const previousBoundary = shiftPeriod(previousStart, period, 1, timeZone);
  const elapsed = now.getTime() - start.getTime();
  const previousEnd = new Date(Math.min(previousStart.getTime() + elapsed, previousBoundary.getTime()));
  const labels: Record<AnalyticsPeriod, string> = { TODAY: "Today", THIS_WEEK: "This week", THIS_MONTH: "This month", THIS_QUARTER: "This quarter", THIS_YEAR: "This year" };
  return { period, label: labels[period], timeZone, start, end: now, previousStart, previousEnd };
}

export function safePercentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

export function comparablePercentChange(current: number, previous: number) {
  return previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;
}

export function countByKey<T extends string>(rows: Array<{ key: T; count: number }>, keys: readonly T[]) {
  const source = new Map(rows.map((row) => [row.key, row.count]));
  return Object.fromEntries(keys.map((key) => [key, source.get(key) ?? 0])) as Record<T, number>;
}

export type CurrencySummary = { currency: string | null; invoiced: number; outstanding: number; paid: number; payments: number };

export function protectMixedCurrency(summaries: CurrencySummary[]) {
  if (summaries.length === 0) return { available: true as const, currency: null, amount: 0 };
  if (summaries.length !== 1 || !summaries[0].currency) return { available: false as const, currency: null, amount: null };
  return { available: true as const, currency: summaries[0].currency, amount: summaries[0].paid };
}
