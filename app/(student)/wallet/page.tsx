import { CreditCard } from "lucide-react";
import { StudentEmptyPage } from "@/features/journey/components/student-empty-page";

export default function WalletPage() {
  return (
    <StudentEmptyPage
      eyebrow="Wallet"
      title="Your wallet"
      message="Payments, invoices, credits, and rewards will appear here when wallet records are connected to your account."
      icon={CreditCard}
    />
  );
}
