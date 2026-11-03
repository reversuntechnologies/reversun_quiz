import { prisma } from "../lib/prisma";

async function main() {
  const quizzes = await prisma.quiz.findMany({
    select: { id: true, title: true, slug: true, createdAt: true, status: true },
  });
  console.log("ALL QUIZZES (" + quizzes.length + "):");
  console.log(JSON.stringify(quizzes, null, 2));

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, name: true },
  });
  console.log("ALL USERS (" + users.length + "):");
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
