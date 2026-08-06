import { PrismaClient } from "@prisma/client";
import { launchPrograms } from "../config/launch-programs";
import { platformRoles } from "../types/auth";

const prisma = new PrismaClient();

async function main() {
  for (const name of platformRoles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  for (const program of launchPrograms) {
    await prisma.program.upsert({
      where: { slug: program.slug },
      update: {
        name: program.title,
        description: program.description,
        durationDays: program.durationDays,
        status: "ACTIVE",
        category: program.category,
        feeType: program.isFree ? "FREE" : "PAID",
        admissionStatus: "OPEN",
        displayOrder: program.displayOrder,
        publicVisible: true
      },
      create: {
        name: program.title,
        slug: program.slug,
        description: program.description,
        durationDays: program.durationDays,
        status: "ACTIVE",
        category: program.category,
        feeType: program.isFree ? "FREE" : "PAID",
        admissionStatus: "OPEN",
        displayOrder: program.displayOrder,
        publicVisible: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
