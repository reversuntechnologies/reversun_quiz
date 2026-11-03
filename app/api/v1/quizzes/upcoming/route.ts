import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const upcomingQuizzes = await prisma.quiz.findMany({
      where: {
        status: "PUBLISHED",
        startsAt: { gt: now },
      },
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
        category: {
          select: { name: true, slug: true },
        },
        _count: {
          select: {
            questions: true,
            registrations: true,
          },
        },
      },
    });

    const formatted = upcomingQuizzes.map((q) => ({
      ...q,
      totalQuestions: q._count.questions,
      participantCount: q._count.registrations,
    }));

    return apiSuccess(formatted, "Upcoming quizzes retrieved successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error listing upcoming quizzes";
    return apiError(message, "UPCOMING_QUIZZES_FAILED", 500);
  }
}
