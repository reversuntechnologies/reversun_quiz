import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    // Top users by all-time cumulative points in point_transactions
    const allTimeLeaderboard = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        display_name: string | null;
        avatar_url: string | null;
        total_points: number;
        quizzes_attended: bigint;
        wins: bigint;
      }>
    >`
      SELECT
        u.id,
        u.name,
        u.display_name,
        u.avatar_url,
        COALESCE(SUM(pt.points), 0)::INT AS total_points,
        COUNT(DISTINCT qa.id) AS quizzes_attended,
        COUNT(DISTINCT qr.id) FILTER (WHERE qr.is_winner = TRUE) AS wins
      FROM users u
      LEFT JOIN point_transactions pt ON pt.user_id = u.id
      LEFT JOIN quiz_attempts qa ON qa.user_id = u.id AND qa.status IN ('SUBMITTED', 'AUTO_SUBMITTED')
      LEFT JOIN quiz_results qr ON qr.user_id = u.id
      WHERE u.is_active = TRUE
      GROUP BY u.id
      ORDER BY total_points DESC, u.id ASC
      LIMIT 100;
    `;

    const leaderboard = allTimeLeaderboard.map((player, index) => ({
      rank: index + 1,
      userId: player.id,
      name: player.display_name || player.name,
      avatarUrl: player.avatar_url,
      points: Number(player.total_points),
      quizzesAttended: Number(player.quizzes_attended),
      wins: Number(player.wins),
    }));

    return apiSuccess(
      {
        period: "all-time",
        updatedAt: new Date().toISOString(),
        leaderboard,
      },
      "All-time leaderboard retrieved successfully"
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching all-time leaderboard";
    return apiError(message, "ALL_TIME_LEADERBOARD_FAILED", 500);
  }
}
