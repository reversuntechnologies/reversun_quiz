import { prisma } from "../lib/prisma";

async function main() {
  const categories = await prisma.category.findMany();
  console.log("CATEGORIES IN DATABASE:", categories);
}

main().finally(async () => {
  await prisma.$disconnect();
});
