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

    const formatted = upcomingQuizzes.map((q: any) => ({
      ...q,
      totalQuestions: q._count?.questions ?? 0,
      participantCount: q._count?.registrations ?? 0,
    }));

    return apiSuccess({ quizzes: formatted }, "Upcoming quizzes retrieved successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error listing upcoming quizzes";
    return apiError(message, "UPCOMING_QUIZZES_FAILED", 500);
  }
}
