import type { AIConversationScope, AIMessageRole, AIProvider } from "@prisma/client";

export type TaraChatMessage = {
  id: string;
  role: AIMessageRole;
  content: string;
  createdAt: Date;
};

export type TaraContext = {
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  };
  scope: AIConversationScope;
  program?: string;
  journey?: string;
  batch?: string;
  currentDay?: string;
  currentWeek?: number;
  learningFlow?: string;
  currentActivity?: string;
  completedActivities: string[];
  pendingActivities: string[];
  reflections: string[];
  submissions: string[];
  assessments: string[];
  announcements: string[];
  calendarEvents: string[];
  crm?: {
    assignedLeads: string[];
    pipelineSummary: string[];
    upcomingCounselling: string[];
    pendingPayments: string[];
    pendingDocuments: string[];
    commissions: string[];
    referrals: string[];
  };
  success?: {
    portfolioStatus?: string;
    projects: string[];
    skills: string[];
    certificates: string[];
    achievements: string[];
    resumes: string[];
    placement?: string;
    internships: string[];
    founderProfile?: string;
  };
  community?: {
    groups: string[];
    events: string[];
    challenges: string[];
    wallet?: string;
    marketplace: string[];
    alumni: string[];
  };
};

export type TaraProviderResponse = {
  content: string;
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
};
