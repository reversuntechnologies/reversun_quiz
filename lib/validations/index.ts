import { z } from "zod";

export const authSyncSchema = z.object({
  firebaseUid: z.string().min(1, "Firebase UID is required"),
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  displayName: z.string().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().nullable(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().min(2).max(50).optional(),
  age: z.number().int().min(1).max(120).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const quizFilterSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]).optional(),
  category: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const submitAnswerSchema = z.object({
  selectedOptionIds: z.array(z.string().uuid("Invalid option ID")).min(1, "Must select at least one option"),
});

export const createQuizSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  registrationDeadline: z.coerce.date().optional(),
  durationMinutes: z.number().int().positive(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  maxAttempts: z.number().int().positive().default(1),
  negativeMarking: z.boolean().default(false),
  resultsPublishAt: z.coerce.date().optional(),
  certificatesEnabled: z.boolean().default(true),
});

export const questionOptionSchema = z.object({
  optionText: z.string().min(1),
  isCorrect: z.boolean().default(false),
  position: z.number().int().nonnegative(),
});

export const createQuestionSchema = z.object({
  questionText: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
  type: z.enum(["SINGLE", "MULTIPLE"]),
  marks: z.number().positive().default(1),
  negativeMarks: z.number().nonnegative().default(0),
  explanation: z.string().optional().nullable(),
  position: z.number().int().nonnegative(),
  options: z.array(questionOptionSchema).min(2, "At least two options are required"),
});
