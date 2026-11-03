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

    const { id } = await context.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        category: true,
        questions: {
          orderBy: { position: "asc" },
          include: {
            options: { orderBy: { position: "asc" } },
          },
        },
        prizes: { orderBy: { position: "asc" } },
        _count: {
          select: {
            registrations: true,
            attempts: true,
            results: true,
          },
        },
      },
    });

    if (!quiz) {
      return apiError("Quiz not found", "NOT_FOUND", 404);
    }

    return apiSuccess(quiz, "Quiz retrieved successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve quiz", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    if (!body) {
      return apiError("Missing update payload", "VALIDATION_ERROR", 400);
    }

    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.description !== undefined) data.description = body.description;
    if (body.difficulty !== undefined) data.difficulty = body.difficulty;
    if (body.status !== undefined) data.status = body.status;
    if (body.durationMinutes !== undefined) data.durationMinutes = Number(body.durationMinutes);
    if (body.negativeMarking !== undefined) data.negativeMarking = Boolean(body.negativeMarking);
    if (body.certificatesEnabled !== undefined) data.certificatesEnabled = Boolean(body.certificatesEnabled);
    if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
    if (body.startsAt !== undefined) data.startsAt = new Date(body.startsAt);
    if (body.endsAt !== undefined) data.endsAt = new Date(body.endsAt);

    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data,
      include: {
        category: true,
        prizes: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "QUIZ_UPDATED",
        entityType: "QUIZ",
        entityId: id,
        metadata: { changes: data },
      },
    });

    return apiSuccess(updatedQuiz, "Quiz updated successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to update quiz", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const { id } = await context.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { title: true },
    });

    if (!quiz) {
      return apiError("Quiz not found", "NOT_FOUND", 404);
    }

    await prisma.quiz.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "QUIZ_DELETED",
        entityType: "QUIZ",
        entityId: id,
        metadata: { title: quiz.title },
      },
    });

    return apiSuccess({ deletedId: id }, "Quiz deleted successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to delete quiz", "INTERNAL_ERROR", 500);
  }
}
