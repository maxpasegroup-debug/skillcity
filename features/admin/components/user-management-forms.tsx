import { assignUserRoleAction, resetUserAccessAction, updateUserStatusAction } from "@/actions/admin-control";
import { Button } from "@/components/ui/button";

type Role = { id: string; name: string };

export function AssignRoleForm({ userId, roles }: { userId: string; roles: Role[] }) {
  return (
    <form action={assignUserRoleAction} className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="userId" value={userId} />
      <select name="roleId" aria-label="Assign role" className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-brand-dark">
        {roles.map((role) => (
          <option key={role.id} value={role.id}>{role.name}</option>
        ))}
      </select>
      <Button variant="secondary">Assign Role</Button>
    </form>
  );
}

export function UserStatusActions({ userId, status }: { userId: string; status: string }) {
  const nextStatus = status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
  return (
    <div className="flex flex-wrap gap-2">
      <form action={updateUserStatusAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="status" value={nextStatus} />
        <Button variant="secondary">{nextStatus === "ACTIVE" ? "Activate" : "Deactivate"}</Button>
      </form>
      <form action={resetUserAccessAction}>
        <input type="hidden" name="userId" value={userId} />
        <Button variant="ghost">Reset Access</Button>
      </form>
    </div>
  );
}
