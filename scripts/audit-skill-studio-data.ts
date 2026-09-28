import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [classified, unclassifiedPrograms, likelySkillStudioPrograms] = await Promise.all([
    prisma.program.findMany({
      where: { operatingDomain: "SKILL_STUDIO", deletedAt: null },
      include: { journeys: true, batches: { include: { trainerAssignments: true } }, enrollments: true }
    }),
    prisma.program.count({ where: { operatingDomain: null, deletedAt: null } }),
    prisma.program.count({
      where: {
        operatingDomain: null,
        deletedAt: null,
        OR: [
          { name: { contains: "skill", mode: "insensitive" } },
          { category: { contains: "skill", mode: "insensitive" } }
        ]
      }
    })
  ]);

  const result = {
    generatedAt: new Date().toISOString(),
    classifiedSkillStudioPrograms: classified.length,
    unclassifiedPrograms,
    likelySkillStudioProgramsForManualReview: likelySkillStudioPrograms,
    missingProgramType: classified.filter((program) => !program.skillStudioType).length,
    missingDeliveryMode: classified.filter((program) => !program.deliveryMode).length,
    missingLearningModel: classified.filter((program) => !program.learningModel).length,
    programsWithoutCurriculum: classified.filter((program) => program.journeys.length === 0).length,
    batchesWithoutTrainer: classified.flatMap((program) => program.batches).filter((batch) => batch.trainerAssignments.length === 0).length,
    enrollmentsWithoutBatch: classified.flatMap((program) => program.enrollments).filter((enrollment) => !enrollment.batchId).length
  };
  console.log(JSON.stringify(result, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Skill Studio audit failed");
  await prisma.$disconnect();
  process.exit(1);
});
