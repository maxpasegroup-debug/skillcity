import { BriefcaseBusiness, Code2, Megaphone, GraduationCap, UsersRound } from "lucide-react";

export type CareerCategorySlug = "business-growth" | "technology" | "digital-marketing-creative" | "education-skill-development" | "hr";
export type CareerRoleSlug =
  | "relationship-manager"
  | "telecaller"
  | "tele-receiver"
  | "full-stack-developer"
  | "digital-marketer"
  | "creative-designer"
  | "video-creator"
  | "industry-mentor"
  | "transition-mentor"
  | "transition-trainer"
  | "program-coordinator"
  | "hr-executive"
  | "hr-manager";

export type CareerRole = {
  slug: CareerRoleSlug;
  title: string;
  intro: string;
  responsibilities: string[];
  requirements: string[];
  growth: string;
  workMode: string;
};

export type CareerCategory = {
  slug: CareerCategorySlug;
  number: string;
  title: string;
  icon: typeof BriefcaseBusiness;
  roles: CareerRole[];
};

export const careerCategories: CareerCategory[] = [
  {
    slug: "business-growth",
    number: "01",
    title: "Business & Growth",
    icon: BriefcaseBusiness,
    roles: [
      {
        slug: "relationship-manager",
        title: "Relationship Manager",
        intro: "Build trusted student relationships and grow AIRA Skill City in your district through disciplined admissions outcomes.",
        responsibilities: ["Guide prospective students clearly", "Manage follow-ups and local growth activity", "Coordinate with admissions and leadership"],
        requirements: ["Strong communication and ownership", "Comfort with targets and field/customer interaction", "Local market awareness"],
        growth:
          "Successful candidates may become eligible for progression to Franchise Manager and the opportunity to lead an AIRA Skill City centre, subject to company evaluation, business requirements and applicable terms.",
        workMode: "District-focused, field and office aligned"
      },
      {
        slug: "telecaller",
        title: "Telecaller",
        intro: "Connect with interested learners and help the admissions team move conversations forward.",
        responsibilities: ["Call and qualify leads", "Update follow-ups accurately", "Coordinate counselling schedules"],
        requirements: ["Clear phone communication", "Basic CRM discipline", "Positive learner-first attitude"],
        growth: "Grow into admissions coordination, relationship management or team leadership based on performance.",
        workMode: "Office or hybrid, based on team plan"
      },
      {
        slug: "tele-receiver",
        title: "Tele-receiver",
        intro: "Handle inbound enquiries with clarity, speed and care.",
        responsibilities: ["Receive inbound calls", "Capture candidate/student context", "Route enquiries to the right team"],
        requirements: ["Patient listening", "Accurate data capture", "Professional phone etiquette"],
        growth: "Grow into counselling support, admissions operations or relationship management.",
        workMode: "Office or hybrid, based on team plan"
      }
    ]
  },
  {
    slug: "technology",
    number: "02",
    title: "Technology",
    icon: Code2,
    roles: [
      {
        slug: "full-stack-developer",
        title: "Full Stack Developer",
        intro: "Build and improve AIRA Skill City operating systems, learning tools and AI-enabled internal products.",
        responsibilities: ["Ship reliable product features", "Work across frontend, backend and database layers", "Improve operational workflows"],
        requirements: ["Strong JavaScript/TypeScript fundamentals", "Practical full-stack project experience", "Good debugging and ownership habits"],
        growth: "Progress into product engineering, technical leadership or AI product ownership.",
        workMode: "Hybrid or remote-aligned, based on project needs"
      }
    ]
  },
  {
    slug: "digital-marketing-creative",
    number: "03",
    title: "Digital Marketing & Creative",
    icon: Megaphone,
    roles: [
      {
        slug: "digital-marketer",
        title: "Digital Marketer",
        intro: "Grow AIRA Skill City through campaigns, content distribution and performance-led digital channels.",
        responsibilities: ["Plan and execute digital campaigns", "Track campaign performance", "Coordinate with creative and admissions teams"],
        requirements: ["Digital channel knowledge", "Analytical mindset", "Strong copy and campaign judgement"],
        growth: "Grow into growth marketing, campaign leadership or brand strategy.",
        workMode: "Office or hybrid, based on campaign plan"
      },
      {
        slug: "creative-designer",
        title: "Creative Designer",
        intro: "Design premium visuals for AIRA Skill City campaigns, learning assets and brand experiences.",
        responsibilities: ["Create campaign and social visuals", "Support brand and UI assets", "Collaborate with content and marketing"],
        requirements: ["Strong visual taste", "Portfolio of practical design work", "Familiarity with modern design tools"],
        growth: "Grow into brand design, product design or creative direction.",
        workMode: "Office or hybrid, portfolio-led"
      },
      {
        slug: "video-creator",
        title: "Video Creator",
        intro: "Create short-form and campaign videos that communicate the energy of AIRA Skill City.",
        responsibilities: ["Shoot or edit videos", "Create social-first content", "Work with mentors, students and leadership stories"],
        requirements: ["Video storytelling sense", "Editing workflow experience", "Comfort with fast content cycles"],
        growth: "Grow into content production, creative strategy or media leadership.",
        workMode: "Office or field-content aligned"
      }
    ]
  },
  {
    slug: "education-skill-development",
    number: "04",
    title: "Education & Skill Development",
    icon: GraduationCap,
    roles: [
      {
        slug: "industry-mentor",
        title: "Industry Mentor",
        intro: "Guide learners with real industry perspective, project feedback and career direction.",
        responsibilities: ["Mentor learners", "Review projects", "Share practical industry insights"],
        requirements: ["Relevant industry experience", "Clear coaching ability", "Outcome-focused feedback style"],
        growth: "Grow into senior mentorship, curriculum leadership or program strategy.",
        workMode: "Part-time, hybrid or session-based"
      },
      {
        slug: "transition-mentor",
        title: "Transition Mentor",
        intro: "Help learners move from learning into income, internships, jobs or entrepreneurial action.",
        responsibilities: ["Guide transition plans", "Support readiness reviews", "Coordinate with trainers and success teams"],
        requirements: ["Mentoring ability", "Career readiness awareness", "Strong follow-up habits"],
        growth: "Grow into learner success leadership or placement ecosystem roles.",
        workMode: "Office or hybrid, learner-facing"
      },
      {
        slug: "transition-trainer",
        title: "Transition Trainer",
        intro: "Train learners in communication, confidence, portfolio readiness and professional execution.",
        responsibilities: ["Run transition sessions", "Assess learner readiness", "Support mock interviews and practice tasks"],
        requirements: ["Training experience", "Strong communication", "Ability to build learner confidence"],
        growth: "Grow into trainer leadership or program development.",
        workMode: "Office or session-based"
      },
      {
        slug: "program-coordinator",
        title: "Program Coordinator",
        intro: "Keep learning programs organized across batches, trainers, schedules and student operations.",
        responsibilities: ["Coordinate batches and schedules", "Track operational tasks", "Support trainers and student communication"],
        requirements: ["Organized execution", "Comfort with dashboards and follow-ups", "Calm communication"],
        growth: "Grow into program operations, academic coordination or campus operations.",
        workMode: "Office-aligned"
      }
    ]
  },
  {
    slug: "hr",
    number: "05",
    title: "HR",
    icon: UsersRound,
    roles: [
      {
        slug: "hr-executive",
        title: "HR Executive",
        intro: "Support recruitment, employee records and people operations for the growing AIRA Skill City team.",
        responsibilities: ["Screen candidates", "Coordinate interviews", "Maintain recruitment and employee records"],
        requirements: ["HR basics", "Good documentation", "Professional candidate communication"],
        growth: "Grow into recruitment ownership, HR operations or people partner responsibilities.",
        workMode: "Office or hybrid, based on hiring cycles"
      },
      {
        slug: "hr-manager",
        title: "HR Manager",
        intro: "Lead hiring discipline, people operations and team growth systems across AIRA Skill City.",
        responsibilities: ["Own recruitment pipelines", "Support department hiring plans", "Improve HR processes"],
        requirements: ["HR/recruitment experience", "People judgement", "Process and compliance orientation"],
        growth: "Grow into people operations leadership across the Skill City ecosystem.",
        workMode: "Office or hybrid, leadership-facing"
      }
    ]
  }
];

export const careerRoles = careerCategories.flatMap((category) => category.roles.map((role) => ({ ...role, category })));

export function getCareerRole(slug: string) {
  return careerRoles.find((role) => role.slug === slug);
}

export function getCareerCategory(slug: string) {
  return careerCategories.find((category) => category.slug === slug);
}
