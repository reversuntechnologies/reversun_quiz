import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getAdminFromRequest } from "@/lib/auth/adminSession";
import { QuizDifficulty, QuizStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as QuizStatus | null;
    const categorySlug = searchParams.get("category");

    const where: any = {};
    if (status && Object.values(QuizStatus).includes(status)) {
      where.status = status;
    }
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    const [quizzes, categories] = await Promise.all([
      prisma.quiz.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          creator: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              questions: true,
              registrations: true,
              attempts: true,
              prizes: true,
            },
          },
        },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return apiSuccess({ quizzes, categories }, "Quizzes retrieved successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve quizzes", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.title || !body.durationMinutes) {
      return apiError("Missing required quiz fields: title, durationMinutes", "VALIDATION_ERROR", 400);
    }

    // Generate slug from title if not provided
    const baseSlug = (body.slug || body.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
    const endsAt = body.endsAt
      ? new Date(body.endsAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    // Validate or fallback category
    let categoryId = body.categoryId || null;
    if (categoryId) {
      const exists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!exists) categoryId = null;
    }
    if (!categoryId) {
      const firstCat = await prisma.category.findFirst({ where: { isActive: true } });
      if (firstCat) categoryId = firstCat.id;
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || null,
        difficulty: (body.difficulty as QuizDifficulty) || "MEDIUM",
        status: (body.status as QuizStatus) || "PUBLISHED",
        startsAt,
        endsAt,
        durationMinutes: Number(body.durationMinutes),
        maxAttempts: Number(body.maxAttempts || 1),
        negativeMarking: Boolean(body.negativeMarking),
        certificatesEnabled: body.certificatesEnabled !== undefined ? Boolean(body.certificatesEnabled) : true,
        categoryId,
        createdBy: admin.id,
        prizes: body.prizes && Array.isArray(body.prizes) && body.prizes.length > 0
          ? {
              create: body.prizes.map((p: any, idx: number) => ({
                position: Number(p.position || idx + 1),
                title: p.title || `${idx + 1}st Place Prize`,
                description: p.description || null,
                rewardType: p.rewardType || "CASH",
                rewardValue: p.rewardValue ? Number(p.rewardValue) : null,
                rewardCurrency: p.rewardCurrency || "INR",
              })),
            }
          : undefined,
        questions: body.questions && Array.isArray(body.questions) && body.questions.length > 0
          ? {
              create: body.questions
                .filter((q: any) => q && q.questionText && q.questionText.trim())
                .map((q: any, qIdx: number) => ({
                  questionText: q.questionText.trim(),
                  type: q.type || "SINGLE",
                  marks: q.marks !== undefined ? Number(q.marks) : 1,
                  negativeMarks: q.negativeMarks !== undefined ? Number(q.negativeMarks) : 0,
                  explanation: q.explanation?.trim() || null,
                  position: qIdx + 1,
                  options: q.options && Array.isArray(q.options)
                    ? {
                        create: q.options
                          .filter((opt: any) => opt && opt.optionText && opt.optionText.trim())
                          .map((opt: any, optIdx: number) => ({
                            optionText: opt.optionText.trim(),
                            isCorrect: Boolean(opt.isCorrect),
                            position: optIdx + 1,
                          })),
                      }
                    : undefined,
                })),
            }
          : undefined,
      },
      include: {
        category: true,
        prizes: true,
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "QUIZ_CREATED",
        entityType: "QUIZ",
        entityId: quiz.id,
        metadata: {
          title: quiz.title,
          slug: quiz.slug,
          status: quiz.status,
          questionCount: quiz.questions?.length || 0,
        },
      },
    });

    return apiSuccess(quiz, "Quiz created successfully", 201);
  } catch (error: any) {
    return apiError(error.message || "Failed to create quiz", "INTERNAL_ERROR", 500);
  }
}
