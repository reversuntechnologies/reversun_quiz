import { prisma } from "../lib/prisma";

async function test() {
  const quizzes = await prisma.quiz.findMany({
    select: { id: true, title: true, status: true, difficulty: true },
  });
  console.log("QUIZZES COUNT:", quizzes.length);
  console.log("QUIZZES:", quizzes);

  const cert = await prisma.certificate.findFirst({
    select: { certificateNumber: true, verificationToken: true, type: true, score: true },
  });
  console.log("SAMPLE CERTIFICATE:", cert);

  const categories = await prisma.category.findMany({ select: { name: true, slug: true } });
  console.log("CATEGORIES:", categories);
}

test()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
