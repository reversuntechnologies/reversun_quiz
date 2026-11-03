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
      try {
        const decoded = await verifyFirebaseIdToken(token);
        verifiedUid = decoded.uid;
        verifiedEmail = decoded.email || null;
      } catch (err) {
        console.warn("Could not verify Firebase token in /auth/sync:", err);
      }
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
    const displayName = body.displayName || body.name || emailPrefix;
    const avatarUrl = body.avatarUrl !== undefined ? body.avatarUrl : null;

    // 1. Look up existing user by firebaseUid
    let user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          name: body.name || user.name,
          displayName: body.displayName || user.displayName,
          avatarUrl: avatarUrl !== null ? avatarUrl : user.avatarUrl,
        },
      });
    } else {
      // 2. Check if user exists by email in Neon PostgreSQL to prevent unique constraint conflict
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        // Link this Firebase UID to the existing Neon PostgreSQL record
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            firebaseUid,
            name: body.name || existingByEmail.name,
            displayName: body.displayName || existingByEmail.displayName,
            avatarUrl: avatarUrl !== null ? avatarUrl : existingByEmail.avatarUrl,
          },
        });
      } else {
        // 3. Create new user record in Neon DB
        user = await prisma.user.create({
          data: {
            firebaseUid,
            email,
            name,
            displayName,
            avatarUrl,
            role: "USER",
          },
        });
      }
    }

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
