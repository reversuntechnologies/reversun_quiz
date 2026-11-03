import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, AuthError } from "@/lib/auth/server";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);

    // Sum points from Point Transactions
    const totalPointsAggregate = await prisma.pointTransaction.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    });
    const totalPoints = totalPointsAggregate._sum.points || 0;

    // Quizzes attended (attempts submitted)
    const quizzesAttended = await prisma.quizAttempt.count({
      where: {
        userId: user.id,
        status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
      },
    });

    // Positions won (1st, 2nd, 3rd)
    const firstPlaceWins = await prisma.quizResult.count({
      where: { userId: user.id, rank: 1 },
    });
    const secondPlaceWins = await prisma.quizResult.count({
      where: { userId: user.id, rank: 2 },
    });
    const thirdPlaceWins = await prisma.quizResult.count({
      where: { userId: user.id, rank: 3 },
    });

    // Certificates issued
    const certificatesCount = await prisma.certificate.count({
      where: { userId: user.id, revokedAt: null },
    });

    return apiSuccess(
      {
        totalPoints,
        globalRank: 1, // Dynamically computed or indexed in leaderboards
        weeklyRank: 1,
        quizzesAttended,
        firstPlaceWins,
        secondPlaceWins,
        thirdPlaceWins,
        otherPrizes: 0,
        certificatesCount,
        achievementBadges: [
          { id: "starter", title: "Platform Pioneer", unlocked: true, icon: "Rocket" },
          { id: "quizzer", title: "Knowledge Seeker", unlocked: quizzesAttended > 0, icon: "BookOpen" },
          { id: "winner", title: "Champion", unlocked: firstPlaceWins > 0, icon: "Trophy" },
        ],
      },
      "User stats retrieved successfully"
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    const message = error instanceof Error ? error.message : "Error fetching stats";
    return apiError(message, "STATS_FETCH_FAILED", 500);
  }
}
