import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy"
};

export default function PrivacyPage() {
  return (
    <main className="skillcity-shell-bg text-brand-dark">
      <Navbar />
      <Section>
        <Container className="max-w-3xl">
          <h1 className="text-4xl font-bold text-brand-dark md:text-5xl">Privacy</h1>
          <div className="mt-8 space-y-6 text-lg leading-8 text-brand-muted">
            <p>
              Skill City collects only the account information needed to provide secure access to the platform, including name, email,
              encrypted password records, session records, verification codes, and security audit logs.
            </p>
            <p>
              Learning data, mentoring activity, and business program records added in future phases will be handled with the same
              principle: collect what is needed, protect it carefully, and use it to improve the learner experience.
            </p>
            <p>
              Skill City is owned by {siteConfig.owner}. For privacy questions, contact{" "}
              <a className="font-bold text-brand-red" href="mailto:contact@skillcity.in">
                contact@skillcity.in
              </a>
              .
            </p>
          </div>
        </Container>
      </Section>
      <Footer />
    </main>
  );
}
