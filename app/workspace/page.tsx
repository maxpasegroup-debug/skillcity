import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, Bot, BriefcaseBusiness, Building2, FlaskConical, Gauge, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { availableV2Workspaces, authorizationRoleKeys, resolveDefaultV2Workspace, resolveSiaEntryPoint, type V2WorkspaceKey } from "@/lib/auth/v2-governance";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

const workspaceIcons = {
  CEO: Gauge,
  DIRECTOR: Gauge,
  PEOPLE: Users,
  ADMISSIONS: BriefcaseBusiness,
  ACADEMIC: GraduationCap,
  ADVISOR: Users,
  TRAINER: GraduationCap,
  GROWTH: BriefcaseBusiness,
  COUNSELLING: Users,
  TELECALLING: Users,
  HUB: Building2,
  COMMUNICATIONS: Bell,
  FINANCE: Building2,
  TECHNOLOGY: Building2,
  LABS_PORTAL: FlaskConical,
  CAREER: BriefcaseBusiness,
  PLATFORM: ShieldCheck,
  EMPLOYEE: Users,
  STUDENT: GraduationCap
} satisfies Record<V2WorkspaceKey, typeof Gauge>;

export default async function WorkspacePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaces = availableV2Workspaces(user);
  const primary = resolveDefaultV2Workspace(user);
  const sia = resolveSiaEntryPoint(user);
  const roles = user.roles.map(({ role }) => role.name);
  const designation = user.employeeProfile?.designation?.name;
  const roleKeys = authorizationRoleKeys(user);

  return (
    <main className="skillcity-shell-bg min-h-screen py-8 text-brand-dark sm:py-10">
      <Container>
        <header className="flex flex-col gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <Link href={primary?.href ?? "/"} aria-label="AIRA Skill City home"><Logo /></Link>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary"><Link href="/notifications"><Bell className="h-4 w-4" />Notifications</Link></Button>
            <form action={logoutAction}><Button type="submit" variant="secondary">Sign out</Button></form>
          </div>
        </header>

        <section className="py-8">
          <p className="text-sm font-black uppercase text-brand-red">My Workspaces</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Welcome, {user.name}</h1>
          <p className="mt-3 max-w-3xl font-semibold leading-7 text-brand-muted">
            {designation ?? (roles.join(" / ") || "AIRA Skill City team member")}. Open only the work areas authorized for your role and organizational scope.
          </p>
        </section>

        <section aria-labelledby="workspace-heading">
          <h2 id="workspace-heading" className="text-xl font-black">Authorized workspaces</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((workspace) => {
              const Icon = workspaceIcons[workspace.key];
              const isPrimary = workspace.key === primary?.key;
              return (
                <Card key={workspace.key}>
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-beige text-brand-red"><Icon className="h-5 w-5" /></div>
                      {isPrimary ? <span className="text-xs font-black uppercase text-brand-red">Primary</span> : null}
                    </div>
                    <h3 className="mt-5 text-xl font-black">{workspace.label}</h3>
                    <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-brand-muted">Permission and organization scope are checked again when this workspace opens.</p>
                    <Button asChild className="mt-5"><Link href={workspace.href}>Open <ArrowRight className="h-4 w-4" /></Link></Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {workspaces.length === 0 ? <Card className="mt-4"><CardContent className="p-6 font-semibold text-brand-muted">No operational workspace is assigned. Contact People & Operations.</CardContent></Card> : null}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3"><Bot className="h-5 w-5 text-brand-red" /><h2 className="text-xl font-black">SIA support</h2></div>
              <p className="mt-3 font-semibold leading-7 text-brand-muted">SIA can summarize authorized information, draft work, and propose actions. People remain responsible for approvals, and SIA cannot grant access or execute privileged changes.</p>
              {sia ? <Button asChild className="mt-5"><Link href={sia.href}>{sia.label}</Link></Button> : <p className="mt-4 text-sm font-bold text-brand-muted">No interactive AI workspace is assigned to this role yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-black">Access summary</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-brand-muted">Roles: {roles.join(", ") || "None"}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-brand-muted">Security role keys: {[...roleKeys].join(", ") || "None"}</p>
            </CardContent>
          </Card>
        </section>
      </Container>
    </main>
  );
}
