import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { QuizStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as QuizStatus | null;
    const categorySlug = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (statusParam) {
      where.status = statusParam;
    } else {
      where.status = { not: "DRAFT" };
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    const [total, quizzes] = await Promise.all([
      prisma.quiz.count({ where }),
      prisma.quiz.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startsAt: "asc" },
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
          registrationDeadline: true,
          durationMinutes: true,
          maxParticipants: true,
          negativeMarking: true,
          resultsPublishAt: true,
          certificatesEnabled: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              questions: true,
              registrations: true,
              attempts: true,
            },
          },
        },
      }),
    ]);

    const formattedQuizzes = quizzes.map((q) => ({
      ...q,
      totalQuestions: q._count.questions,
      participantCount: q._count.registrations,
    }));

    return apiSuccess({ quizzes: formattedQuizzes, total }, "Quizzes retrieved successfully", 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error listing quizzes";
    return apiError(message, "QUIZ_LIST_FAILED", 500);
  }
}
