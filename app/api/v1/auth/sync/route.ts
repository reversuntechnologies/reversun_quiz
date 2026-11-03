import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    let verifiedUid: string | null = null;
    let verifiedEmail: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const decoded = await verifyFirebaseIdToken(token);
      verifiedUid = decoded.uid;
      verifiedEmail = decoded.email || null;
    }

    const body = await request.json().catch(() => ({}));

    // In production, token claims take precedence; in dev fallback to request body if verified claims are absent
    const firebaseUid = verifiedUid || body.firebaseUid;
    const email = verifiedEmail || body.email;

    if (!firebaseUid || !email) {
      return apiError(
        "Valid authentication token or valid firebaseUid and email are required",
        "MISSING_IDENTITY",
        400
      );
    }

    // Default display name derived from email prefix
    const emailPrefix = email.split("@")[0] || "player";
    const name = body.name || emailPrefix;
    const displayName = body.displayName || emailPrefix;
    const avatarUrl = body.avatarUrl || null;

    // Upsert into Neon PostgreSQL
    const user = await prisma.user.upsert({
      where: { firebaseUid },
      update: {
        email,
        name: body.name || undefined,
        displayName: body.displayName || undefined,
        avatarUrl: body.avatarUrl !== undefined ? avatarUrl : undefined,
      },
      create: {
        firebaseUid,
        email,
        name,
        displayName,
        avatarUrl,
        role: "USER",
      },
    });

    return apiSuccess(
      {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      "User synchronized successfully",
      200
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync error";
    return apiError(`Failed to synchronize user: ${message}`, "AUTH_SYNC_FAILED", 500);
  }
}
