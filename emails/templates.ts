import { siteConfig } from "@/config/site";

export function welcomeEmail(name: string) {
  return {
    subject: "Welcome to SkillCity",
    html: `<p>Hello ${name},</p><p>Welcome to SkillCity. Tara AI is ready to support your learning journey.</p><p>Owned by ${siteConfig.owner}</p>`
  };
}

export function otpEmail(code: string) {
  return {
    subject: "Your SkillCity verification code",
    html: `<p>Your SkillCity verification code is <strong>${code}</strong>.</p><p>This code expires soon for your security.</p>`
  };
}

export function resetPasswordEmail(url: string) {
  return {
    subject: "Reset your SkillCity password",
    html: `<p>Use the secure link below to reset your SkillCity password.</p><p><a href="${url}">Reset password</a></p>`
  };
}
