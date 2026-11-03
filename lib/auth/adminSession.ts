import crypto from "node:crypto";
import { UserRole } from "@prisma/client";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "reversun-super-secure-admin-secret-key-2026";
const SESSION_COOKIE_NAME = "reversun_admin_session";
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface AdminSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

export function createAdminToken(payload: Omit<AdminSessionPayload, "createdAt" | "expiresAt">): string {
  const now = Date.now();
  const fullPayload: AdminSessionPayload = {
    ...payload,
    createdAt: now,
    expiresAt: now + SESSION_EXPIRY_SECONDS * 1000,
  };

  const payloadString = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadString)
    .digest("base64url");

  return `${payloadString}.${signature}`;
}

export function verifyAdminToken(token: string): AdminSessionPayload | null {
  try {
    const [payloadString, signature] = token.split(".");
    if (!payloadString || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadString)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, "utf-8"),
        Buffer.from(expectedSignature, "utf-8")
      )
    ) {
      return null;
    }

    const payloadJson = Buffer.from(payloadString, "base64url").toString("utf-8");
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function getAdminFromRequest(request: NextRequest) {
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;
  const token = cookieToken || bearerToken;

  if (!token) return null;

  const payload = verifyAdminToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) return null;
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") return null;

  return user;
}

export { SESSION_COOKIE_NAME, SESSION_EXPIRY_SECONDS };
