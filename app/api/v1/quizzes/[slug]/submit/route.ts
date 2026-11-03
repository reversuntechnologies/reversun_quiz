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
    const { attemptId, answers } = body as {
      attemptId: string;
      answers: Record<string, string>; // questionId -> selectedOptionId
    };

    if (!attemptId) {
      return apiError("Attempt ID is required", "MISSING_ATTEMPT_ID", 400);
    }

    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      include: {
        questions: {
          where: { isActive: true },
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return apiError("Quiz not found", "QUIZ_NOT_FOUND", 404);
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { user: true },
    });

    if (!attempt) {
      return apiError("Quiz attempt not found", "ATTEMPT_NOT_FOUND", 404);
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
      return apiError("This attempt has already been submitted", "ALREADY_SUBMITTED", 400);
    }

    const now = new Date();
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const breakdown = quiz.questions.map((question) => {
      const qMarks = Number(question.marks);
      const qNegMarks = Number(question.negativeMarks);
      maxScore += qMarks;

      const correctOption = question.options.find((opt) => opt.isCorrect);
      const selectedOptionId = answers ? answers[question.id] : undefined;

      let isCorrect = false;
      let awardedMarks = 0;

      if (!selectedOptionId) {
        skippedCount++;
      } else if (correctOption && selectedOptionId === correctOption.id) {
        isCorrect = true;
        awardedMarks = qMarks;
        totalScore += qMarks;
        correctCount++;
      } else {
        isCorrect = false;
        if (quiz.negativeMarking && qNegMarks > 0) {
          awardedMarks = -qNegMarks;
          totalScore -= qNegMarks;
        }
        incorrectCount++;
      }

      return {
        questionId: question.id,
        questionText: question.questionText,
        selectedOptionId,
        correctOptionId: correctOption?.id,
        isCorrect,
        awardedMarks,
        explanation: question.explanation,
      };
    });

    // Score cannot be negative overall
    totalScore = Math.max(0, totalScore);

    const completionTimeMs = BigInt(Math.max(0, now.getTime() - new Date(attempt.startedAt).getTime()));

    // Update the attempt in Neon
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        totalScore,
        maxScore,
      },
    });

    // Save individual question answers for audit
    for (const item of breakdown) {
      if (item.selectedOptionId) {
        const savedAnswer = await prisma.attemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId: item.questionId,
            },
          },
          update: {
            isCorrect: item.isCorrect,
            awardedMarks: item.awardedMarks,
            answeredAt: now,
          },
          create: {
            attemptId,
            questionId: item.questionId,
            isCorrect: item.isCorrect,
            awardedMarks: item.awardedMarks,
            answeredAt: now,
          },
        });

        await prisma.attemptAnswerOption.upsert({
          where: {
            answerId_optionId: {
              answerId: savedAnswer.id,
              optionId: item.selectedOptionId,
            },
          },
          update: {},
          create: {
            answerId: savedAnswer.id,
            optionId: item.selectedOptionId,
          },
        });
      }
    }

    // Award participation points (10 pts) if not already awarded
    try {
      await prisma.pointTransaction.upsert({
        where: {
          userId_source_sourceReference: {
            userId: attempt.userId,
            source: "QUIZ_PARTICIPATION",
            sourceReference: quiz.id,
          },
        },
        update: {},
        create: {
          userId: attempt.userId,
          quizId: quiz.id,
          source: "QUIZ_PARTICIPATION",
          sourceReference: quiz.id,
          points: 10,
          description: `Participated in ${quiz.title}`,
        },
      });
    } catch {
      // Points already logged or relation exists
    }

    const durationSeconds = Math.round(Number(completionTimeMs) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeFormatted = `${minutes}m ${seconds}s`;

    return apiSuccess(
      {
        totalScore,
        maxScore,
        correctCount,
        incorrectCount,
        skippedCount,
        accuracyPercentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        completionTimeMs: Number(completionTimeMs),
        completionTimeFormatted: timeFormatted,
        submittedAt: now.toISOString(),
        breakdown,
      },
      "Quiz answers submitted and graded successfully"
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error submitting quiz answers";
    return apiError(message, "SUBMISSION_FAILED", 500);
  }
}
