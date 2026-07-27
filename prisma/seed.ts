import { PrismaClient } from "@prisma/client";
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
