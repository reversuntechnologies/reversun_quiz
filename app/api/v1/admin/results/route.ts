import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getAdminFromRequest } from "@/lib/auth/adminSession";
import crypto from "node:crypto";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      // Return past quizzes available for results review
      const completedQuizzes = await prisma.quiz.findMany({
        orderBy: { endsAt: "desc" },
        include: {
          category: { select: { name: true } },
          _count: { select: { results: true, attempts: true, certificates: true } },
        },
      });
      return apiSuccess({ completedQuizzes }, "Completed quizzes retrieved");
    }

    const [quiz, results, attempts] = await Promise.all([
      prisma.quiz.findUnique({
        where: { id: quizId },
        include: { prizes: { orderBy: { position: "asc" } } },
      }),
      prisma.quizResult.findMany({
        where: { quizId },
        orderBy: { rank: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.quizAttempt.findMany({
        where: { quizId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
        orderBy: [{ totalScore: "desc" }, { submittedAt: "asc" }],
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    if (!quiz) return apiError("Quiz not found", "NOT_FOUND", 404);

    return apiSuccess({ quiz, results, rawSubmissions: attempts }, "Results retrieved successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve results", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.quizId) {
      return apiError("quizId is required to finalize results", "VALIDATION_ERROR", 400);
    }

    const quizId = body.quizId;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { prizes: { orderBy: { position: "asc" } } },
    });
    if (!quiz) return apiError("Quiz not found", "NOT_FOUND", 404);

    // 1. Fetch all valid submitted attempts sorted by Score DESC, then SubmittedAt ASC (Tie-breaker!)
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      orderBy: [{ totalScore: "desc" }, { submittedAt: "asc" }],
      include: { user: true },
    });

    if (attempts.length === 0) {
      return apiError("No submitted attempts found for this quiz to evaluate.", "NO_SUBMISSIONS", 400);
    }

    // 2. Clear old results for idempotence
    await prisma.quizResult.deleteMany({ where: { quizId } });

    let rankCounter = 1;
    const createdResults = [];
    const createdCertificates = [];

    for (const att of attempts) {
      const rank = rankCounter++;
      const isWinner = rank <= 3;
      const completionTimeMs = att.submittedAt
        ? BigInt(att.submittedAt.getTime() - att.startedAt.getTime())
        : null;

      const result = await prisma.quizResult.create({
        data: {
          quizId,
          userId: att.userId,
          attemptId: att.id,
          score: att.totalScore,
          rank,
          position: rank,
          completionTimeMs,
          isWinner,
        },
      });
      createdResults.push(result);

      // Award points for participation & winning
      const awardedPoints = rank === 1 ? 250 : rank === 2 ? 175 : rank === 3 ? 120 : 50;
      await prisma.pointTransaction.upsert({
        where: {
          userId_source_sourceReference: {
            userId: att.userId,
            source: isWinner ? `QUIZ_RANK_${rank}` : "QUIZ_PARTICIPATION",
            sourceReference: quizId,
          },
        },
        update: {},
        create: {
          userId: att.userId,
          quizId,
          source: isWinner ? `QUIZ_RANK_${rank}` : "QUIZ_PARTICIPATION",
          sourceReference: quizId,
          points: awardedPoints,
          description: isWinner
            ? `Rank #${rank} in ${quiz.title}`
            : `Completed ${quiz.title}`,
        },
      });

      // Generate Verifiable Certificate if enabled
      if (quiz.certificatesEnabled) {
        const certNumber = `REV-${new Date().getFullYear()}-CERT-${Math.floor(1000 + Math.random() * 9000)}`;
        const verificationToken = crypto.randomUUID();

        const cert = await prisma.certificate.create({
          data: {
            certificateNumber: certNumber,
            verificationToken,
            userId: att.userId,
            quizId,
            type: isWinner ? "WINNER" : "PARTICIPATION",
            position: rank,
            score: att.totalScore,
            pdfUrl: `/certificates/verify/${verificationToken}`,
          },
        });
        createdCertificates.push(cert);
      }
    }

    // Mark quiz results publish date
    await prisma.quiz.update({
      where: { id: quizId },
      data: { resultsPublishAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "RESULTS_FINALIZED_AND_CERTIFICATES_ISSUED",
        entityType: "QUIZ",
        entityId: quizId,
        metadata: {
          totalEvaluated: attempts.length,
          certificatesIssued: createdCertificates.length,
        },
      },
    });

    return apiSuccess(
      {
        totalEvaluated: attempts.length,
        certificatesIssued: createdCertificates.length,
        topWinnerId: attempts[0]?.userId,
      },
      `Successfully finalized rankings for ${attempts.length} participants and dispatched certificates.`
    );
  } catch (error: any) {
    return apiError(error.message || "Failed to finalize results", "INTERNAL_ERROR", 500);
  }
}
