import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => ({}));
    const userEmail = body.userEmail || "user@reversun.com";

    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { position: "asc" },
          include: {
            options: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                optionText: true,
                position: true,
                // Notice: isCorrect is deliberately EXCLUDED so clients cannot inspect answer keys
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return apiError("Quiz not found", "QUIZ_NOT_FOUND", 404);
    }

    if (quiz.questions.length === 0) {
      return apiError("This quiz currently has no published questions", "NO_QUESTIONS", 400);
    }

    // Find or create participant user
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: `guest_${Date.now()}`,
          email: userEmail,
          name: body.userName || "Participant",
          displayName: body.userName || "Participant",
        },
      });
    }

    // Check for existing active attempt
    let attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: quiz.id,
        userId: user.id,
        status: "IN_PROGRESS",
      },
    });

    const now = new Date();

    if (!attempt) {
      const deadline = new Date(now.getTime() + quiz.durationMinutes * 60 * 1000);
      const attemptCount = await prisma.quizAttempt.count({
        where: { quizId: quiz.id, userId: user.id },
      });

      attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          userId: user.id,
          attemptNumber: attemptCount + 1,
          status: "IN_PROGRESS",
          startedAt: now,
          deadlineAt: deadline,
          maxScore: quiz.questions.reduce((sum, q) => sum + Number(q.marks), 0),
        },
      });
    }

    return apiSuccess(
      {
        attempt: {
          id: attempt.id,
          startedAt: attempt.startedAt,
          deadlineAt: attempt.deadlineAt,
          durationMinutes: quiz.durationMinutes,
        },
        quiz: {
          id: quiz.id,
          title: quiz.title,
          slug: quiz.slug,
          negativeMarking: quiz.negativeMarking,
          totalQuestions: quiz.questions.length,
        },
        questions: quiz.questions.map((q) => ({
          id: q.id,
          position: q.position,
          questionText: q.questionText,
          imageUrl: q.imageUrl,
          type: q.type,
          marks: Number(q.marks),
          negativeMarks: Number(q.negativeMarks),
          options: q.options,
        })),
        serverTime: now.toISOString(),
      },
      "Quiz session initialized"
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error starting quiz";
    return apiError(message, "QUIZ_START_FAILED", 500);
  }
}
