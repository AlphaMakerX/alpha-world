import { TRPCError } from "@trpc/server";

function statusToTrpcCode(status?: number) {
  switch (status) {
    case 404:
      return "NOT_FOUND" as const;
    case 409:
      return "CONFLICT" as const;
    default:
      return "BAD_REQUEST" as const;
  }
}

export function unwrapUseCaseResult<T extends { ok: boolean }>(
  result: T,
): Extract<T, { ok: true }> {
  if (!result.ok) {
    const { error, status } = result as unknown as {
      ok: false;
      error: string;
      status?: number;
    };
    throw new TRPCError({
      code: statusToTrpcCode(status),
      message: error,
    });
  }
  return result as Extract<T, { ok: true }>;
}
