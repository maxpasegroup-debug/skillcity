import Link from "next/link";
import { Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AssignRoleForm, UserStatusActions } from "@/features/admin/components/user-management-forms";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdminUsersAndRoles } from "@/server/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const data = await getAdminUsersAndRoles(query);
  const activeUsers = data.users.filter((user) => user.status === "ACTIVE");
  const staffUsers = data.users.filter((user) => user.roles.some((item) => item.role.name !== "Student"));

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Users & Roles" title="Access management" description="View users, assign existing roles, deactivate access, and reset sessions or student login credentials." />

      <section className="grid gap-5 sm:grid-cols-3">
        <DirectorMetricCard label="Users Shown" value={data.users.length} icon={Users} />
        <DirectorMetricCard label="Active Users" value={activeUsers.length} icon={ShieldCheck} />
        <DirectorMetricCard label="Staff Users" value={staffUsers.length} icon={ShieldCheck} />
      </section>

      <Card>
        <CardContent className="p-5">
          <form action="/admin/users" className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="relative block">
              <span className="sr-only">Search users</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input name="q" defaultValue={query} placeholder="Search user, email, phone, WhatsApp" className="h-12 w-full rounded-lg border border-black/10 bg-white pl-11 pr-4 font-bold text-brand-dark outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/10" />
            </label>
            <Button>Search</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        {data.users.map((user) => {
          const roles = user.roles.map((item) => item.role.name).join(", ") || "No role";
          const lastSession = user.sessions[0];
          const credential = user.studentLoginCredentials[0];
          return (
            <Card key={user.id}>
              <CardContent className="grid gap-5 p-5 xl:grid-cols-[1fr_360px]">
                <div>
                  <p className="text-sm font-black text-brand-red">{user.status}</p>
                  <h2 className="mt-1 text-2xl font-black text-brand-dark">{user.name}</h2>
                  <div className="mt-4 grid gap-3 text-sm font-bold text-brand-muted sm:grid-cols-2 xl:grid-cols-3">
                    <p>Email: <span className="text-brand-dark">{user.email}</span></p>
                    <p>Mobile: <span className="text-brand-dark">{credential?.whatsapp ?? "Not linked"}</span></p>
                    <p>Role: <span className="text-brand-dark">{roles}</span></p>
                    <p>Created: <span className="text-brand-dark">{user.createdAt.toLocaleDateString()}</span></p>
                    <p>Last login: <span className="text-brand-dark">{lastSession?.createdAt.toLocaleString() ?? "Not available"}</span></p>
                    <p>Student access: <span className="text-brand-dark">{credential?.status ?? "None"}</span></p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="secondary">
                      <Link href={`/admin/users?user=${user.id}`}>View</Link>
                    </Button>
                    <UserStatusActions userId={user.id} status={user.status} />
                  </div>
                </div>
                <div className="rounded-lg bg-brand-card p-4">
                  <AssignRoleForm userId={user.id} roles={data.roles} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-black text-brand-dark">Audit Log</h2>
          <div className="mt-5 space-y-3">
            {data.auditLogs.map((log) => (
              <div key={log.id} className="rounded-lg bg-white p-4">
                <p className="font-black text-brand-dark">{log.action.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm font-bold text-brand-muted">{log.user?.name ?? "System"} - {log.createdAt.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
