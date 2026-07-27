"use client";

import { useTransition } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertPaidLeadToEnrollmentAction } from "@/actions/admissions";

export function ConvertEnrollmentButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();
  return <Button type="button" disabled={pending} onClick={() => startTransition(async () => convertPaidLeadToEnrollmentAction(invoiceId))}><GraduationCap className="h-5 w-5" />Enroll</Button>;
}
