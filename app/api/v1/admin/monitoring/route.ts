import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getAdminFromRequest } from "@/lib/auth/adminSession";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const now = new Date();

    // 1. Find live quizzes
    const liveQuizzes = await prisma.quiz.findMany({
      where: {
        status: "PUBLISHED",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        category: { select: { name: true } },
        _count: {
          select: {
            questions: true,
            registrations: true,
            attempts: true,
          },
        },
      },
    });

    // 2. Active attempts currently in progress
    const activeAttempts = await prisma.quizAttempt.findMany({
      where: {
        status: "IN_PROGRESS",
      },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
        quiz: { select: { id: true, title: true, durationMinutes: true } },
        _count: { select: { answers: true } },
      },
    });

    // 3. Recent completed submissions
    const recentSubmissions = await prisma.quizAttempt.findMany({
      where: {
        status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
      },
      orderBy: { submittedAt: "desc" },
      take: 15,
      include: {
        user: { select: { id: true, name: true, email: true } },
        quiz: { select: { id: true, title: true } },
      },
    });

    // 4. Summary metrics
    const [totalUsers, totalAttempts, totalCertificates] = await Promise.all([
      prisma.user.count(),
      prisma.quizAttempt.count(),
      prisma.certificate.count(),
    ]);

    return apiSuccess(
      {
        serverTime: now.toISOString(),
        liveQuizzes,
        activeAttempts,
        recentSubmissions,
        summary: {
          totalUsers,
          totalAttempts,
          totalCertificates,
          liveQuizzesCount: liveQuizzes.length,
          activeConcurrentTakers: activeAttempts.length,
        },
      },
      "Live competition telemetry retrieved successfully"
    );
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve monitoring telemetry", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.action) {
      return apiError("Missing emergency action command", "VALIDATION_ERROR", 400);
    }

    // Action 1: Extend live quiz duration by X minutes
    if (body.action === "EXTEND_QUIZ_TIME" && body.quizId) {
      const minutes = Number(body.minutes || 10);
      const quiz = await prisma.quiz.findUnique({ where: { id: body.quizId } });
      if (!quiz) return apiError("Quiz not found", "NOT_FOUND", 404);

      const newEndsAt = new Date(quiz.endsAt.getTime() + minutes * 60 * 1000);
      await prisma.quiz.update({
        where: { id: body.quizId },
        data: {
          endsAt: newEndsAt,
          durationMinutes: quiz.durationMinutes + minutes,
        },
      });

      // Also extend active in-progress attempts deadline
      const activeAttemptsToExtend = await prisma.quizAttempt.findMany({
        where: { quizId: body.quizId, status: "IN_PROGRESS" },
        select: { id: true, deadlineAt: true },
      });

      for (const att of activeAttemptsToExtend) {
        await prisma.quizAttempt.update({
          where: { id: att.id },
          data: {
            deadlineAt: new Date(att.deadlineAt.getTime() + minutes * 60 * 1000),
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "EMERGENCY_EXTEND_QUIZ_TIME",
          entityType: "QUIZ",
          entityId: body.quizId,
          metadata: { addedMinutes: minutes, newEndsAt },
        },
      });

      return apiSuccess({ newEndsAt, addedMinutes: minutes }, `Quiz extended by ${minutes} minutes`);
    }

    // Action 2: Invalidate compromised attempt
    if (body.action === "INVALIDATE_ATTEMPT" && body.attemptId) {
      const attempt = await prisma.quizAttempt.update({
        where: { id: body.attemptId },
        data: { status: "INVALIDATED" },
      });

      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "ATTEMPT_INVALIDATED_MALPRACTICE",
          entityType: "QUIZ_ATTEMPT",
          entityId: body.attemptId,
          reason: body.reason || "Integrity violation / Tab-switching limit exceeded",
        },
      });

      return apiSuccess(attempt, "Attempt invalidated successfully");
    }

    return apiError("Unknown action command", "BAD_REQUEST", 400);
  } catch (error: any) {
    return apiError(error.message || "Failed to execute emergency control", "INTERNAL_ERROR", 500);
  }
}
