import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: unknown | null;
}

export function apiSuccess<T>(
  data: T,
  message = "Operation completed successfully",
  status = 200,
  meta: Record<string, unknown> | null = null
) {
  const responseBody: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return NextResponse.json(responseBody, { status });
}

export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  errors: unknown = null
) {
  const responseBody: ApiErrorResponse = {
    success: false,
    message,
    code,
    errors,
  };
  return NextResponse.json(responseBody, { status });
}
