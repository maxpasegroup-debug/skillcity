export const platformRoles = [
  "Student",
  "Telecaller",
  "Counsellor",
  "Trainer",
  "Director",
  "CEO",
  "COO",
  "HOD",
  "HR Manager",
  "HR Executive",
  "Interviewer",
  "Admission",
  "Business Development",
  "Relationship Manager",
  "Admin"
] as const;

export type PlatformRole = (typeof platformRoles)[number];
