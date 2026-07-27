export const platformRoles = [
  "Student",
  "Trainer",
  "Director",
  "Admission",
  "Business Development",
  "Admin"
] as const;

export type PlatformRole = (typeof platformRoles)[number];
