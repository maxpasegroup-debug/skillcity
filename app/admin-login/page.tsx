import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { AdminLoginForm } from "@/features/admin/components/admin-auth-forms";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  const roles = user?.roles.map((item) => item.role.name) ?? [];
  if (roles.some((role) => role === "Admin" || role === "Director")) redirect("/admin/dashboard");

  return (
    <main className="skillcity-shell-bg grid min-h-screen place-items-center px-5 py-10 text-brand-dark">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <Logo />
          <p className="mt-8 text-sm font-black uppercase tracking-wide text-brand-red">Admin Control Center</p>
          <h1 className="mt-3 text-4xl font-black text-brand-dark">Secure login</h1>
          <p className="mt-3 font-semibold leading-7 text-brand-muted">Enter your admin mobile number and PIN.</p>
          <div className="mt-8">
            <AdminLoginForm />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
