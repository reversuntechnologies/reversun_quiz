import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getAdminFromRequest } from "@/lib/auth/adminSession";
import { QuestionType } from "@prisma/client";

interface ImportedQuestion {
  questionText: string;
  type?: QuestionType;
  marks?: number;
  negativeMarks?: number;
  explanation?: string;
  options: { optionText: string; isCorrect: boolean }[];
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.quizId) {
      return apiError("quizId is required for importing questions", "VALIDATION_ERROR", 400);
    }

    const quizId = body.quizId;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, title: true },
    });
    if (!quiz) {
      return apiError("Quiz not found", "NOT_FOUND", 404);
    }

    let parsedQuestions: ImportedQuestion[] = [];

    // 1. JSON Array input
    if (Array.isArray(body.questions)) {
      parsedQuestions = body.questions.filter((q: any) => q.questionText && Array.isArray(q.options));
    }
    // 2. CSV Text input
    else if (typeof body.csvContent === "string") {
      const lines = body.csvContent
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);

      // Skip header if line 0 looks like header
      const startIndex = lines[0]?.toLowerCase().includes("question") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        // Simple CSV splitter handling quoted values
        const row = parseCsvLine(lines[i]);
        if (row.length >= 6) {
          const [
            qText,
            qType = "SINGLE",
            marks = "1",
            negMarks = "0",
            explanation = "",
            optA,
            optB,
            optC,
            optD,
            correctLetter = "A",
          ] = row;

          const optionsList: { optionText: string; isCorrect: boolean }[] = [];
          const correctKey = correctLetter.trim().toUpperCase();

          if (optA) optionsList.push({ optionText: optA.trim(), isCorrect: correctKey.includes("A") || correctKey === "1" });
          if (optB) optionsList.push({ optionText: optB.trim(), isCorrect: correctKey.includes("B") || correctKey === "2" });
          if (optC) optionsList.push({ optionText: optC.trim(), isCorrect: correctKey.includes("C") || correctKey === "3" });
          if (optD) optionsList.push({ optionText: optD.trim(), isCorrect: correctKey.includes("D") || correctKey === "4" });

          if (optionsList.length >= 2) {
            parsedQuestions.push({
              questionText: qText.trim(),
              type: qType.toUpperCase().includes("MULT") ? "MULTIPLE" : "SINGLE",
              marks: Number(marks) || 1,
              negativeMarks: Number(negMarks) || 0,
              explanation: explanation.trim() || undefined,
              options: optionsList,
            });
          }
        }
      }
    }

    if (parsedQuestions.length === 0) {
      return apiError("No valid questions could be extracted from input. Please check format.", "VALIDATION_ERROR", 400);
    }

    // Determine starting position
    const lastQuestion = await prisma.question.findFirst({
      where: { quizId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    let currentPosition = (lastQuestion?.position || 0) + 1;

    let importedCount = 0;

    // Insert questions and options inside transactions
    for (const q of parsedQuestions) {
      await prisma.question.create({
        data: {
          quizId,
          questionText: q.questionText,
          type: q.type || "SINGLE",
          marks: q.marks !== undefined ? q.marks : 1,
          negativeMarks: q.negativeMarks !== undefined ? q.negativeMarks : 0,
          explanation: q.explanation || null,
          position: currentPosition++,
          options: {
            create: q.options.map((opt, oIdx) => ({
              optionText: opt.optionText,
              isCorrect: Boolean(opt.isCorrect),
              position: oIdx + 1,
            })),
          },
        },
      });
      importedCount++;
    }

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "QUESTIONS_BULK_IMPORTED",
        entityType: "QUIZ",
        entityId: quizId,
        metadata: { importedCount, quizTitle: quiz.title },
      },
    });

    return apiSuccess(
      { importedCount, quizId, quizTitle: quiz.title },
      `Successfully imported ${importedCount} questions into "${quiz.title}"`
    );
  } catch (error: any) {
    return apiError(error.message || "Failed to bulk import questions", "INTERNAL_ERROR", 500);
  }
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === "," && !insideQuote) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((col) => col.replace(/^"(.*)"$/, "$1").trim());
}
