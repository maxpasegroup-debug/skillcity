import { describe, expect, it } from "vitest";
import { comparablePercentChange, countByKey, normalizeAnalyticsPeriod, protectMixedCurrency, resolveAnalyticsRange, safePercentage } from "@/lib/analytics/metrics";

describe("executive analytics metric semantics", () => {
  it("uses a controlled period catalog", () => {
    expect(normalizeAnalyticsPeriod("THIS_QUARTER")).toBe("THIS_QUARTER");
    expect(normalizeAnalyticsPeriod("CUSTOM_INJECTION")).toBe("THIS_MONTH");
  });

  it("starts an India business day at the matching UTC instant", () => {
    const range = resolveAnalyticsRange("TODAY", new Date("2026-09-29T08:00:00.000Z"), "Asia/Kolkata");
    expect(range.start.toISOString()).toBe("2026-09-28T18:30:00.000Z");
    expect(range.timeZone).toBe("Asia/Kolkata");
  });

  it("uses Monday as the start of the reporting week", () => {
    const range = resolveAnalyticsRange("THIS_WEEK", new Date("2026-09-30T12:00:00.000Z"), "Asia/Kolkata");
    expect(range.start.toISOString()).toBe("2026-09-27T18:30:00.000Z");
  });

  it("builds a previous comparable period with equal elapsed duration", () => {
    const range = resolveAnalyticsRange("THIS_MONTH", new Date("2026-09-15T06:30:00.000Z"), "Asia/Kolkata");
    expect(range.end.getTime() - range.start.getTime()).toBe(range.previousEnd.getTime() - range.previousStart.getTime());
  });

  it("does not invent a percentage for a zero denominator", () => {
    expect(safePercentage(5, 0)).toBeNull();
    expect(safePercentage(1, 4)).toBe(25);
  });

  it("does not show a trend percentage when the previous value is zero", () => {
    expect(comparablePercentChange(8, 0)).toBeNull();
    expect(comparablePercentChange(12, 10)).toBe(20);
  });

  it("returns explicit zeroes for missing grouped statuses", () => {
    expect(countByKey([{ key: "ACTIVE" as const, count: 3 }], ["ACTIVE", "INACTIVE"] as const)).toEqual({ ACTIVE: 3, INACTIVE: 0 });
  });

  it("allows a single verified currency headline", () => {
    expect(protectMixedCurrency([{ currency: "INR", invoiced: 100, outstanding: 20, paid: 80, payments: 2 }])).toEqual({ available: true, currency: "INR", amount: 80 });
  });

  it("blocks mixed-currency and missing-currency headline sums", () => {
    expect(protectMixedCurrency([{ currency: "INR", invoiced: 100, outstanding: 0, paid: 100, payments: 1 }, { currency: "USD", invoiced: 50, outstanding: 0, paid: 50, payments: 1 }]).available).toBe(false);
    expect(protectMixedCurrency([{ currency: null, invoiced: 100, outstanding: 0, paid: 100, payments: 1 }]).available).toBe(false);
  });

  it("represents an empty financial period without fabricated revenue", () => {
    expect(protectMixedCurrency([])).toEqual({ available: true, currency: null, amount: 0 });
  });
});
