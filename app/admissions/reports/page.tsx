import { getAdmissionDashboard } from "@/server/admissions/queries";
import AdmissionDashboardPage from "../dashboard/page";

export default async function ReportsPage() {
  await getAdmissionDashboard();
  return <AdmissionDashboardPage />;
}
