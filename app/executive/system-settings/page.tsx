import { Card, CardContent } from "@/components/ui/card";
import { SystemSettingForm } from "@/features/executive/components/executive-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveData } from "@/server/executive/queries";

export default async function SystemSettingsPage() {
  const [institutions, , , , , , settings] = await getExecutiveData();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="System Settings" title="Provider and platform settings" description="Institution branding, programs, roles, permissions, email, AI, payment, storage and notification providers." /><Card><CardContent className="p-6"><SystemSettingForm institutions={institutions} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{settings.map((setting) => <Card key={setting.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{setting.encrypted ? "Encrypted" : "Visible"}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{setting.key}</h2><p className="mt-2 font-bold text-brand-muted">{setting.institution?.name ?? "Platform"}</p></CardContent></Card>)}</div></div>;
}
