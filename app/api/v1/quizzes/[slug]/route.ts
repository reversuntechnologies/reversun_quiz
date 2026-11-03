import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return apiError("Quiz slug is required", "MISSING_SLUG", 400);
    }

    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        prizes: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: {
            questions: true,
            registrations: true,
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return apiError("Quiz not found", "QUIZ_NOT_FOUND", 404);
    }

    return apiSuccess({ quiz }, "Quiz details fetched successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching quiz";
    return apiError(message, "QUIZ_FETCH_FAILED", 500);
  }
}
