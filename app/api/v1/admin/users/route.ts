import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getAdminFromRequest } from "@/lib/auth/adminSession";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as UserRole | null;

    const where: any = {};
    if (role && Object.values(UserRole).includes(role)) {
      where.role = role;
    }
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            attempts: true,
            registrations: true,
            certificates: true,
          },
        },
        pointTransactions: {
          select: { points: true },
        },
      },
    });

    const formattedUsers = users.map((u) => {
      const totalPoints = u.pointTransactions.reduce((acc, p) => acc + p.points, 0);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        displayName: u.displayName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        totalPoints,
        attemptsCount: u._count.attempts,
        registrationsCount: u._count.registrations,
        certificatesCount: u._count.certificates,
      };
    });

    return apiSuccess(formattedUsers, "Users retrieved successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve users", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError("Unauthorized: Administrator session required", "UNAUTHORIZED", 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.userId) {
      return apiError("userId is required", "VALIDATION_ERROR", 400);
    }

    const data: any = {};
    if (body.role !== undefined && Object.values(UserRole).includes(body.role)) {
      data.role = body.role;
    }
    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    const updatedUser = await prisma.user.update({
      where: { id: body.userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "USER_ROLE_OR_STATUS_MODIFIED",
        entityType: "USER",
        entityId: updatedUser.id,
        metadata: { changes: data, targetUser: updatedUser.email },
      },
    });

    return apiSuccess(updatedUser, "User updated successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to update user", "INTERNAL_ERROR", 500);
  }
}
