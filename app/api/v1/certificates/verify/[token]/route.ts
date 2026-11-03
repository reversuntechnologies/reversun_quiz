import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return apiError("Verification token or certificate number is required", "MISSING_TOKEN", 400);
    }

    const trimmed = decodeURIComponent(token).trim();

    // Query either by verificationToken or certificateNumber
    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          { verificationToken: trimmed },
          { certificateNumber: { equals: trimmed, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            displayName: true,
            email: true,
          },
        },
        quiz: {
          select: {
            title: true,
            slug: true,
            difficulty: true,
          },
        },
      },
    });

    if (!certificate) {
      return apiError("Certificate not found or invalid token", "CERTIFICATE_NOT_FOUND", 404);
    }

    const isRevoked = Boolean(certificate.revokedAt);

    return apiSuccess(
      {
        valid: !isRevoked,
        certificateNumber: certificate.certificateNumber,
        verificationToken: certificate.verificationToken,
        holder: certificate.user.displayName || certificate.user.name,
        quiz: certificate.quiz?.title || "REVERSUN Competition League",
        quizSlug: certificate.quiz?.slug || null,
        position: certificate.position,
        score: certificate.score ? Number(certificate.score) : null,
        type: certificate.type,
        issuedAt: certificate.issuedAt,
        isRevoked,
        revokeReason: certificate.revokeReason,
      },
      isRevoked ? "Certificate has been revoked" : "Certificate verified successfully"
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error verifying certificate";
    return apiError(message, "VERIFICATION_FAILED", 500);
  }
}
