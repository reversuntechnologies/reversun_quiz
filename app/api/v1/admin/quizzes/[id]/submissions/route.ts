import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getAdminFromRequest } from "@/lib/auth/adminSession";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const { id: quizId } = await context.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        questions: {
          orderBy: { position: "asc" },
          include: {
            options: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                optionText: true,
                isCorrect: true,
                position: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return apiError("Quiz not found", "NOT_FOUND", 404);
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId },
      orderBy: [
        { totalScore: "desc" },
        { submittedAt: "asc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                position: true,
                marks: true,
                explanation: true,
              },
            },
            selectedOptions: {
              include: {
                option: {
                  select: {
                    id: true,
                    optionText: true,
                    isCorrect: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format attempts with question-by-question breakdown against the quiz's questions
    const formattedAttempts = attempts.map((att, rank) => {
      const timeSpentSec = att.submittedAt
        ? Math.max(0, Math.floor((att.submittedAt.getTime() - att.startedAt.getTime()) / 1000))
        : null;

      // Map answers by questionId for fast lookup
      const answersMap = new Map();
      att.answers.forEach((ans) => {
        const selectedOpt = ans.selectedOptions[0]?.option || null;
        answersMap.set(ans.questionId, {
          answerId: ans.id,
          isCorrect: ans.isCorrect,
          awardedMarks: ans.awardedMarks ? Number(ans.awardedMarks) : 0,
          answeredAt: ans.answeredAt,
          selectedOption: selectedOpt
            ? {
                id: selectedOpt.id,
                optionText: selectedOpt.optionText,
                position: selectedOpt.position,
              }
            : null,
        });
      });

      const questionBreakdown = quiz.questions.map((q) => {
        const answer = answersMap.get(q.id);
        const correctOpt = q.options.find((opt) => opt.isCorrect);

        return {
          questionId: q.id,
          position: q.position,
          questionText: q.questionText,
          marks: Number(q.marks),
          explanation: q.explanation,
          options: q.options,
          correctOptionId: correctOpt?.id,
          correctOptionText: correctOpt?.optionText,
          selectedOptionId: answer?.selectedOption?.id || null,
          selectedOptionText: answer?.selectedOption?.optionText || null,
          isCorrect: answer ? Boolean(answer.isCorrect) : false,
          isSkipped: !answer || !answer.selectedOption,
          awardedMarks: answer ? answer.awardedMarks : 0,
        };
      });

      const correctCount = questionBreakdown.filter((b) => b.isCorrect).length;
      const incorrectCount = questionBreakdown.filter((b) => !b.isCorrect && !b.isSkipped).length;
      const skippedCount = questionBreakdown.filter((b) => b.isSkipped).length;

      return {
        id: att.id,
        rank: rank + 1,
        status: att.status,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        timeSpentSec,
        timeSpentFormatted: timeSpentSec
          ? `${Math.floor(timeSpentSec / 60)}m ${timeSpentSec % 60}s`
          : "N/A",
        totalScore: Number(att.totalScore),
        maxScore: Number(att.maxScore || quiz.questions.reduce((sum, q) => sum + Number(q.marks), 0)),
        correctCount,
        incorrectCount,
        skippedCount,
        user: att.user,
        questionBreakdown,
      };
    });

    // Compute overview stats
    const totalAttempts = formattedAttempts.length;
    const completedAttempts = formattedAttempts.filter((a) => a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED");
    const avgScore =
      completedAttempts.length > 0
        ? (completedAttempts.reduce((sum, a) => sum + a.totalScore, 0) / completedAttempts.length).toFixed(1)
        : "0.0";
    const highestScore =
      completedAttempts.length > 0
        ? Math.max(...completedAttempts.map((a) => a.totalScore))
        : 0;

    return apiSuccess(
      {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          slug: quiz.slug,
          difficulty: quiz.difficulty,
          durationMinutes: quiz.durationMinutes,
          negativeMarking: quiz.negativeMarking,
          category: quiz.category,
          totalQuestions: quiz.questions.length,
          questions: quiz.questions,
        },
        attempts: formattedAttempts,
        stats: {
          totalAttempts,
          completedCount: completedAttempts.length,
          avgScore,
          highestScore,
        },
      },
      "Quiz candidate submissions retrieved successfully"
    );
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve quiz submissions", "INTERNAL_ERROR", 500);
  }
}
