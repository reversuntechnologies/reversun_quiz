import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const liveQuizzes = await prisma.quiz.findMany({
      where: {
        status: "PUBLISHED",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { endsAt: "asc" },
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

    const formatted = liveQuizzes.map((q: any) => ({
      ...q,
      totalQuestions: q._count?.questions ?? 0,
      participantCount: q._count?.registrations ?? 0,
    }));

    return apiSuccess({ quizzes: formatted }, "Live quizzes retrieved successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error listing live quizzes";
    return apiError(message, "LIVE_QUIZZES_FAILED", 500);
  }
}
