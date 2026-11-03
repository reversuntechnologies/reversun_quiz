import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getAdminFromRequest } from "@/lib/auth/adminSession";
import { QuestionType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      return apiError("quizId is required to list questions", "VALIDATION_ERROR", 400);
    }

    const questions = await prisma.question.findMany({
      where: { quizId },
      orderBy: { position: "asc" },
      include: {
        options: { orderBy: { position: "asc" } },
      },
    });

    return apiSuccess(questions, "Questions retrieved successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve questions", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.quizId || !body.questionText || !body.options || !Array.isArray(body.options)) {
      return apiError("Missing required fields: quizId, questionText, options array", "VALIDATION_ERROR", 400);
    }

    // Determine next position
    const lastQuestion = await prisma.question.findFirst({
      where: { quizId: body.quizId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const nextPosition = (lastQuestion?.position || 0) + 1;

    const question = await prisma.question.create({
      data: {
        quizId: body.quizId,
        questionText: body.questionText.trim(),
        imageUrl: body.imageUrl || null,
        type: (body.type as QuestionType) || "SINGLE",
        marks: Number(body.marks || 1),
        negativeMarks: Number(body.negativeMarks || 0),
        explanation: body.explanation?.trim() || null,
        position: nextPosition,
        options: {
          create: body.options.map((opt: any, idx: number) => ({
            optionText: String(opt.optionText || "").trim(),
            isCorrect: Boolean(opt.isCorrect),
            position: idx + 1,
          })),
        },
      },
      include: {
        options: { orderBy: { position: "asc" } },
      },
    });

    return apiSuccess(question, "Question created successfully", 201);
  } catch (error: any) {
    return apiError(error.message || "Failed to create question", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("Question id is required", "VALIDATION_ERROR", 400);
    }

    await prisma.question.delete({
      where: { id },
    });

    return apiSuccess({ deletedId: id }, "Question deleted successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to delete question", "INTERNAL_ERROR", 500);
  }
}
