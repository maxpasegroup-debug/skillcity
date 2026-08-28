export const platformRoles = [
  "Student",
  "Telecaller",
  "Counsellor",
  "Trainer",
  "Director",
  "Admission",
  "Business Development",
  "Admin"
] as const;

export type PlatformRole = (typeof platformRoles)[number];
