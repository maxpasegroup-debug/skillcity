import { Card, CardContent } from "@/components/ui/card";
import { AdminPinChangeForm } from "@/features/admin/components/admin-auth-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";

export const dynamic = "force-dynamic";

export default function AdminSecuritySettingsPage() {
  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Security" title="Change admin PIN" description="Change the current admin PIN. Active sessions are revoked after a successful change." />
      <Card className="max-w-xl">
        <CardContent className="p-6">
          <AdminPinChangeForm />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-black text-brand-dark">Security Notes</h2>
          <div className="mt-5 space-y-3 text-sm font-semibold leading-7 text-brand-muted">
            <p>The current PIN is never displayed.</p>
            <p>The new PIN is hashed before storage.</p>
            <p>After a successful change, existing sessions are invalidated and re-login is required.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
