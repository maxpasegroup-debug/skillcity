import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [
    talentProfiles,
    employers,
    opportunities,
    applications,
    referrals,
    internalRecruitmentApplications,
    placementApplications,
    admissionsReferrals,
    wallets,
    commissions,
    studentPortfolios,
    resumeProfiles
  ] = await Promise.all([
    prisma.careerTalentProfile.count(),
    prisma.careerEmployer.groupBy({ by: ["status"], _count: true }),
    prisma.careerOpportunity.groupBy({ by: ["status"], _count: true }),
    prisma.careerOpportunityApplication.groupBy({ by: ["status"], _count: true }),
    prisma.careerReferral.count(),
    prisma.careerApplication.count(),
    prisma.placementApplication.count(),
    prisma.referral.count(),
    prisma.wallet.count(),
    prisma.commissionRecord.count(),
    prisma.studentPortfolio.count(),
    prisma.resumeProfile.count()
  ]);

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    careerHub: { talentProfiles, employers, opportunities, applications, referrals },
    adjacentAuthoritativeRecordsNotMigrated: {
      internalRecruitmentApplications,
      placementApplications,
      admissionsReferrals,
      wallets,
      commissions,
      studentPortfolios,
      resumeProfiles
    }
  }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Career Hub audit failed");
  await prisma.$disconnect();
  process.exit(1);
});
