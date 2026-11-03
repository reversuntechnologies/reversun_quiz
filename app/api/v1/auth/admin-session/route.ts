import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { verifyAdminToken, SESSION_COOKIE_NAME } from "@/lib/auth/adminSession";

export async function GET(request: NextRequest) {
  try {
    // Check cookie first, then Bearer header
    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return apiError("No active administrator session found", "NO_SESSION", 401);
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return apiError("Invalid or expired administrator session", "INVALID_SESSION", 401);
    }

    // Verify user still exists, is active, and still holds admin role in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return apiError("Administrator account is inactive", "ACCOUNT_INACTIVE", 403);
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return apiError("Administrator privileges revoked", "FORBIDDEN", 403);
    }

    return apiSuccess({
      user,
      expiresAt: payload.expiresAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error verifying session";
    return apiError(message, "SESSION_ERROR", 500);
  }
}

export async function POST() {
  // Logout endpoint
  const response = apiSuccess({ loggedOut: true }, "Administrator session cleared successfully");
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
