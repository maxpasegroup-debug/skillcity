import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({ productFindFirst: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { labsProduct: { findFirst: mocks.productFindFirst } } }));

import { assertLabsProductAccess } from "@/server/auth/resource-access";

describe("Labs product resource access", () => {
  beforeEach(() => vi.clearAllMocks());
  const actor = { id: "director", roles: [{ role: { name: "Director" } }] };

  it("allows an authorized scoped product", async () => {
    mocks.productFindFirst.mockResolvedValue({ id: "product-1" });
    await expect(assertLabsProductAccess(actor, "labs.read", "product-1")).resolves.toEqual({ id: "product-1" });
  });

  it("blocks an unauthorized or crafted product identifier", async () => {
    mocks.productFindFirst.mockResolvedValue(null);
    await expect(assertLabsProductAccess(actor, "labs.read", "other-product")).rejects.toBeInstanceOf(AuthorizationError);
  });
});
