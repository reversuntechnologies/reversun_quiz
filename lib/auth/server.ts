import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import { User, UserRole } from "@prisma/client";

export interface AuthenticatedUserContext {
  user: User;
  firebaseUid: string;
  email: string;
}

/**
 * Extracts and verifies the Firebase ID token from the request Authorization header.
 * Then looks up the corresponding User record in PostgreSQL.
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUserContext> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Missing or malformed Authorization header. Expected 'Bearer <token>'", 401, "UNAUTHORIZED");
  }

  const token = authHeader.substring(7).trim();

  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(token);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid token";
    throw new AuthError(`Token verification failed: ${message}`, 401, "INVALID_TOKEN");
  }

  if (!decoded.uid || !decoded.email) {
    throw new AuthError("Token payload missing required identity claims", 401, "INVALID_TOKEN_CLAIMS");
  }

  const user = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  });

  if (!user) {
    throw new AuthError("User profile does not exist in database. Call /auth/sync first.", 404, "USER_NOT_FOUND");
  }

  if (!user.isActive) {
    throw new AuthError("User account has been suspended or deactivated", 403, "ACCOUNT_SUSPENDED");
  }

  return {
    user,
    firebaseUid: decoded.uid,
    email: decoded.email,
  };
}

/**
 * Guard that enforces specific role permissions.
 */
export function requireRole(user: User, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Insufficient permissions to access this resource", 403, "FORBIDDEN");
  }
}

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 401, code = "AUTH_ERROR") {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
