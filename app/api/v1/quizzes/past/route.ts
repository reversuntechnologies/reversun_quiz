import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const pastQuizzes = await prisma.quiz.findMany({
      where: {
        status: "PUBLISHED",
        endsAt: { lt: now },
      },
      orderBy: { endsAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnailUrl: true,
        difficulty: true,
        status: true,
        startsAt: true,
        endsAt: true,
        resultsPublishAt: true,
        category: {
          select: { name: true, slug: true },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    const formatted = pastQuizzes.map((q) => ({
      ...q,
      totalQuestions: q._count.questions,
      completedAttempts: q._count.attempts,
    }));

    return apiSuccess(formatted, "Past quizzes retrieved successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error listing past quizzes";
    return apiError(message, "PAST_QUIZZES_FAILED", 500);
  }
}
