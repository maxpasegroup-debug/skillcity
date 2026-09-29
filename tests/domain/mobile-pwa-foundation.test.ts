import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { findActiveNavigationHref, isNavigationItemActive, selectPrimaryNavigation } from "@/lib/experience/mobile-navigation";

const read = (path: string) => readFileSync(path, "utf8");

describe("mobile and PWA foundation", () => {
  it("publishes standalone installability metadata with branded icons", () => {
    const value = manifest();
    expect(value.name).toBe("AIRA Skill City");
    expect(value.start_url).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.theme_color).toBe("#EB001B");
    expect(value.icons?.some((icon) => icon.src === "/pwa/icon-192.png" && icon.sizes === "192x192")).toBe(true);
    expect(value.icons?.some((icon) => icon.src === "/pwa/icon-maskable-512.png" && icon.purpose?.includes("maskable"))).toBe(true);
  });

  it("limits the bottom bar while retaining the complete drawer source", () => {
    const items = Array.from({ length: 7 }, (_, index) => ({ href: `/item-${index}`, label: `Item ${index}` }));
    expect(selectPrimaryNavigation(items)).toEqual(items.slice(0, 4));
    expect(items).toHaveLength(7);
  });

  it("selects only the most specific active route", () => {
    const items = [{ href: "/career", label: "Career" }, { href: "/career/opportunities", label: "Opportunities" }];
    expect(findActiveNavigationHref(items, "/career/opportunities/role-1")).toBe("/career/opportunities");
    expect(isNavigationItemActive("/career", "/career?filter=open")).toBe(false);
  });

  it("provides an accessible drawer, notifications, and the existing logout action", () => {
    const source = read("components/layout/mobile-app-navigation.tsx");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain("event.key === \"Escape\"");
    expect(source).toContain("logoutAction");
    expect(source).toContain('href="/notifications"');
  });

  it("uses the shared navigation in every authenticated application shell", () => {
    for (const file of ["admin", "admissions", "bdm", "communications", "community", "core-operations", "counsellor", "director", "employee", "executive", "labs", "rm", "student", "success", "telecaller", "trainer"]) {
      expect(read(`components/layout/${file}-shell.tsx`), file).toContain("MobileAppNavigation");
    }
  });

  it("keeps private navigations and APIs out of service-worker caches", () => {
    const source = read("public/sw.js");
    expect(source).toContain('url.pathname.startsWith("/api/")');
    expect(source).toContain('request.mode === "navigate"');
    expect(source).toContain('fetch(request).catch(() => caches.match("/offline"))');
    expect(source).not.toMatch(/cache\.put\(request[\s\S]*request\.mode === "navigate"/);
    expect(source).not.toContain("localStorage");
  });

  it("registers the worker only in production", () => {
    const source = read("components/pwa/pwa-runtime.tsx");
    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain('register("/sw.js", { scope: "/" })');
  });

  it("provides network, loading, and recoverable error states", () => {
    expect(read("app/offline/page.tsx")).toContain("You are offline");
    expect(read("app/loading.tsx")).toContain('aria-busy="true"');
    expect(read("app/error.tsx")).toContain("reset");
  });

  it("uses one employee query for mobile cards and the desktop table", () => {
    const source = read("app/employees/page.tsx");
    expect(source.match(/getEmployeeDirectory/g)).toHaveLength(2);
    expect(source).toContain('className="grid gap-4 lg:hidden"');
    expect(source).toContain('className="hidden overflow-hidden lg:block"');
  });

  it("keeps mobile executive metrics on the Phase 11 analytics service", () => {
    const source = read("app/executive/dashboard/page.tsx");
    expect(source).toContain("getExecutiveIntelligence");
    expect(source).not.toContain("mobileMetric");
  });

  it("retains secure cookie-backed sessions without client token storage", () => {
    const source = read("server/auth/session.ts");
    expect(source).toContain("httpOnly: true");
    expect(source).toContain('sameSite: "lax"');
    expect(source).toContain('secure: process.env.NODE_ENV === "production"');
    expect(source).not.toContain("localStorage");
  });

  it("retains touch-sized shared controls and typed mobile inputs", () => {
    expect(read("components/ui/button.tsx")).toContain('md: "h-12');
    expect(read("components/ui/input.tsx")).toContain('"h-12 w-full');
    expect(read("features/auth/components/login-form.tsx")).toContain('inputMode="tel"');
    expect(read("features/auth/components/login-form.tsx")).toContain('inputMode="numeric"');
  });
});
