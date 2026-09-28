import { Resend } from "resend";
import { env } from "@/lib/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required in production");
    }
    console.info("[email:development] provider unavailable; message not sent");
    return { status: "QUEUED" as const, provider: "UNCONFIGURED" };
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: "SkillCity <noreply@skillcity.in>",
    to,
    subject,
    html
  });
  return { status: "SUBMITTED" as const, provider: "RESEND", providerRef: result.data?.id };
}
