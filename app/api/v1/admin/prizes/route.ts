import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth/adminSession";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Admin authentication required", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    const where: Record<string, unknown> = {};
    if (quizId) {
      where.quizId = quizId;
    }

    const prizes = await prisma.prize.findMany({
      where,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
      orderBy: [{ quizId: "asc" }, { position: "asc" }],
    });

    return apiSuccess({ prizes }, "Prizes fetched successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching prizes";
    return apiError(message, "PRIZE_FETCH_FAILED", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Admin authentication required", "UNAUTHORIZED", 401);
    }

    const body = await request.json().catch(() => ({}));
    const { quizId, position, title, description, rewardType, rewardValue, rewardCurrency } = body;

    if (!quizId || !position || !title) {
      return apiError("quizId, position, and title are required", "VALIDATION_ERROR", 400);
    }

    const prize = await prisma.prize.upsert({
      where: {
        quizId_position: {
          quizId,
          position: Number(position),
        },
      },
      update: {
        title,
        description: description || null,
        rewardType: rewardType || "OTHER",
        rewardValue: rewardValue !== undefined && rewardValue !== null ? Number(rewardValue) : null,
        rewardCurrency: rewardCurrency || "INR",
      },
      create: {
        quizId,
        position: Number(position),
        title,
        description: description || null,
        rewardType: rewardType || "OTHER",
        rewardValue: rewardValue !== undefined && rewardValue !== null ? Number(rewardValue) : null,
        rewardCurrency: rewardCurrency || "INR",
      },
    });

    return apiSuccess({ prize }, "Prize saved successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error saving prize";
    return apiError(message, "PRIZE_SAVE_FAILED", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Admin authentication required", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("Prize ID is required", "VALIDATION_ERROR", 400);
    }

    await prisma.prize.delete({
      where: { id },
    });

    return apiSuccess({ deletedId: id }, "Prize deleted successfully");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting prize";
    return apiError(message, "PRIZE_DELETE_FAILED", 500);
  }
}
