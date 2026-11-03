import { prisma } from "../lib/prisma";

async function main() {
  console.log("Cleaning up 3 demo quizzes and demo users...");

  // 1. Delete all existing attempts, answers, registrations, results, prizes for the 3 demo quizzes
  const demoQuizzes = await prisma.quiz.findMany({
    where: {
      slug: {
        in: [
          "nextjs-system-design-sprint-2026",
          "ai-agents-llm-engineering-challenge-2026",
          "postgresql-internals-championship-2026",
        ],
      },
    },
    select: { id: true, title: true },
  });

  const quizIds = demoQuizzes.map((q: any) => q.id);

  if (quizIds.length > 0) {
    console.log(`Found ${quizIds.length} demo quizzes to remove:`, demoQuizzes.map((q: any) => q.title));

    // Delete attempts and related
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: { in: quizIds } },
      select: { id: true },
    });
    const attemptIds = attempts.map((a: any) => a.id);

    if (attemptIds.length > 0) {
      await prisma.attemptAnswerOption.deleteMany({
        where: { answer: { attemptId: { in: attemptIds } } },
      });
      await prisma.attemptAnswer.deleteMany({
        where: { attemptId: { in: attemptIds } },
      });
      await prisma.quizResult.deleteMany({
        where: { quizId: { in: quizIds } },
      });
      await prisma.quizAttempt.deleteMany({
        where: { quizId: { in: quizIds } },
      });
    }

    await prisma.quizRegistration.deleteMany({
      where: { quizId: { in: quizIds } },
    });

    await prisma.prize.deleteMany({
      where: { quizId: { in: quizIds } },
    });

    await prisma.certificate.deleteMany({
      where: { quizId: { in: quizIds } },
    });

    await prisma.announcement.deleteMany({
      where: { quizId: { in: quizIds } },
    });

    await prisma.pointTransaction.deleteMany({
      where: { quizId: { in: quizIds } },
    });

    // Delete question options & questions
    await prisma.questionOption.deleteMany({
      where: { question: { quizId: { in: quizIds } } },
    });
    await prisma.question.deleteMany({
      where: { quizId: { in: quizIds } },
    });

    // Delete audit logs referencing these quizzes
    await prisma.auditLog.deleteMany({
      where: { entityType: "QUIZ", entityId: { in: quizIds } },
    });

    // Delete quizzes
    await prisma.quiz.deleteMany({
      where: { id: { in: quizIds } },
    });

    console.log("Successfully removed demo quizzes!");
  } else {
    console.log("No demo quizzes matching slugs found.");
  }

  // 2. Remove demo users, keeping ONLY admin@reversun.com
  const nonAdminUsers = await prisma.user.findMany({
    where: {
      email: { not: "admin@reversun.com" },
    },
    select: { id: true, email: true },
  });

  const userIds = nonAdminUsers.map((u: any) => u.id);
  if (userIds.length > 0) {
    console.log(`Found ${userIds.length} non-admin users to clean up:`, nonAdminUsers.map((u: any) => u.email));

    // Clear user attempts/results/registrations/certificates/points/auditLogs
    const userAttempts = await prisma.quizAttempt.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const userAttemptIds = userAttempts.map((a: any) => a.id);

    if (userAttemptIds.length > 0) {
      await prisma.attemptAnswerOption.deleteMany({
        where: { answer: { attemptId: { in: userAttemptIds } } },
      });
      await prisma.attemptAnswer.deleteMany({
        where: { attemptId: { in: userAttemptIds } },
      });
      await prisma.quizAttempt.deleteMany({
        where: { id: { in: userAttemptIds } },
      });
    }

    await prisma.quizResult.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.quizRegistration.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.certificate.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.pointTransaction.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.auditLog.deleteMany({
      where: { actorId: { in: userIds } },
    });

    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
    console.log("Successfully removed demo users!");
  }

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  console.log("REMAINING USERS IN DATABASE:", remainingUsers);

  const remainingQuizzes = await prisma.quiz.findMany({
    select: { id: true, title: true },
  });
  console.log("REMAINING QUIZZES IN DATABASE:", remainingQuizzes);
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
