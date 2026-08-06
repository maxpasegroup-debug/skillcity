import type { Metadata } from "next";
import { AiraLandingV2 } from "@/features/landing/components/aira-landing-v2";

export const metadata: Metadata = {
  title: "AIRA Skill City",
  description: "A modern learning campus where ideas become careers. Learn. Build. Earn. Grow."
};

export default function HomePage() {
  return <AiraLandingV2 />;
}
