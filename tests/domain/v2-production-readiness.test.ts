import { describe, expect, it } from "vitest";
import { validateV2ProductionEnvironment, V2_DEPARTMENT_HEAD_KEYS, V2_REQUIRED_MIGRATIONS } from "@/lib/launch/v2-production";

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://user:secret@database.internal:5432/skillcity",
  NEXT_PUBLIC_APP_URL: "https://airaskillcity.com",
  RESEND_API_KEY: "configured",
  OPENAI_API_KEY: "configured"
};

describe("V2 production readiness policy", () => {
  it("locks the required release migrations and department heads", () => {
    expect(V2_REQUIRED_MIGRATIONS).toEqual([
      "20260929000100_remediate_production_blockers",
      "20260929000200_add_v2_internal_communications",
      "20260929000300_add_v2_sia_department_approvals"
    ]);
    expect(V2_DEPARTMENT_HEAD_KEYS).toHaveLength(6);
  });

  it("accepts the minimum production environment without exposing values", () => {
    expect(validateV2ProductionEnvironment(validEnvironment)).toEqual([]);
  });

  it("rejects missing providers and non-HTTPS public URLs", () => {
    const issues = validateV2ProductionEnvironment({ ...validEnvironment, NEXT_PUBLIC_APP_URL: "http://airaskillcity.com", RESEND_API_KEY: "", OPENAI_API_KEY: "" });
    expect(issues.map((issue) => issue.variable)).toEqual(expect.arrayContaining(["NEXT_PUBLIC_APP_URL", "RESEND_API_KEY", "OPENAI_API_KEY"]));
    expect(JSON.stringify(issues)).not.toContain(String(validEnvironment.DATABASE_URL));
  });

  it("requires private document delivery to be fully configured", () => {
    const issues = validateV2ProductionEnvironment({ ...validEnvironment, PRIVATE_DOCUMENT_PROVIDER: "object-store" });
    expect(issues).toContainEqual(expect.objectContaining({ variable: "PRIVATE_DOCUMENT_*" }));
  });

  it("requires an HTTPS gateway and a strong signing secret when private delivery is enabled", () => {
    const issues = validateV2ProductionEnvironment({
      ...validEnvironment,
      PRIVATE_DOCUMENT_PROVIDER: "object-store",
      PRIVATE_DOCUMENT_GATEWAY_URL: "http://documents.example.com/download",
      PRIVATE_DOCUMENT_SIGNING_SECRET: "short"
    });
    expect(issues.map((issue) => issue.variable)).toEqual(expect.arrayContaining(["PRIVATE_DOCUMENT_GATEWAY_URL", "PRIVATE_DOCUMENT_SIGNING_SECRET"]));
  });
});
