import { redirect } from "next/navigation";
import type { PermissionKey, ResourceScope } from "@/lib/auth/permissions";
import { canAccessResource, hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";

export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requirePermission(permission: PermissionKey, loginPath = "/login") {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath);
  if (!hasPermission(user, permission)) redirect("/dashboard");
  return user;
}

export async function assertPermission(permission: PermissionKey) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, permission)) throw new AuthorizationError();
  return user;
}

export async function assertScopedPermission(permission: PermissionKey, resource: ResourceScope) {
  const user = await assertPermission(permission);
  if (!canAccessResource(user, permission, resource)) throw new AuthorizationError("Forbidden outside assigned organization scope");
  return user;
}
