import { TRPCError } from "@trpc/server";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

const NUMERIC_STATUS_TO_CODE: Record<number, UseCaseErrorCode> = {
  404: "NOT_FOUND",
  409: "CONFLICT",
};

function toTrpcCode(code: UseCaseErrorCode) {
  switch (code) {
    case "NOT_FOUND":
      return "NOT_FOUND" as const;
    case "CONFLICT":
      return "CONFLICT" as const;
    default:
      return "BAD_REQUEST" as const;
  }
}

export function unwrapUseCaseResult<T extends { ok: boolean }>(
  result: T,
): Extract<T, { ok: true }> {
  if (!result.ok) {
    const failure = result as unknown as {
      ok: false;
      error: string;
      code?: UseCaseErrorCode;
      status?: number;
    };
    const code = failure.code
      ?? NUMERIC_STATUS_TO_CODE[failure.status ?? 0]
      ?? "BAD_REQUEST";
    throw new TRPCError({
      code: toTrpcCode(code),
      message: failure.error,
    });
  }
  return result as Extract<T, { ok: true }>;
}
