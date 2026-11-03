import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, AuthError } from "@/lib/auth/server";
import { updateProfileSchema } from "@/lib/validations";
import { apiSuccess, apiError } from "@/lib/api/response";

function calculateCompletionPercentage(user: {
  email: string | null;
  name: string | null;
  displayName: string | null;
  age: number | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
}): number {
  const fields = [
    Boolean(user.email),
    Boolean(user.name),
    Boolean(user.displayName),
    user.age !== null && user.age !== undefined,
    Boolean(user.phone),
    Boolean(user.bio),
    Boolean(user.avatarUrl),
  ];
  const filledCount = fields.filter(Boolean).length;
  return Math.round((filledCount / fields.length) * 100);
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    const completionPercentage = calculateCompletionPercentage(user);

    return apiSuccess(
      {
        ...user,
        completionPercentage,
      },
      "Profile fetched successfully"
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    const message = error instanceof Error ? error.message : "Error fetching profile";
    return apiError(message, "PROFILE_FETCH_FAILED", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    const body = await request.json().catch(() => ({}));
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid profile data", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const data = parsed.data;
    const isProfileCompleteNow =
      (data.name || user.name) &&
      (data.displayName || user.displayName) &&
      (data.phone || user.phone) &&
      (data.age !== undefined ? data.age : user.age);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name ?? undefined,
        displayName: data.displayName ?? undefined,
        age: data.age !== undefined ? data.age : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
        profileCompletedAt: isProfileCompleteNow ? new Date() : user.profileCompletedAt,
      },
    });

    const completionPercentage = calculateCompletionPercentage(updatedUser);

    return apiSuccess(
      {
        ...updatedUser,
        completionPercentage,
      },
      "Profile updated successfully"
    );
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    const message = error instanceof Error ? error.message : "Error updating profile";
    return apiError(message, "PROFILE_UPDATE_FAILED", 500);
  }
}
