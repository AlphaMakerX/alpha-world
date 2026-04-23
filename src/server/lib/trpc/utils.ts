/**
 * tRPC 工具函数
 *
 * 提供用例结果到 tRPC 响应的转换工具，
 * 将用例层返回的 ok/error 联合类型自动解包为成功值或抛出对应的 TRPCError。
 */

import { TRPCError } from "@trpc/server";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 数字状态码到用例错误码的映射表（兼容旧的数字状态码） */
const NUMERIC_STATUS_TO_CODE: Record<number, UseCaseErrorCode> = {
  404: "NOT_FOUND",
  409: "CONFLICT",
};

/** 将用例错误码映射为 tRPC 错误码 */
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

/**
 * 解包用例结果
 *
 * 如果结果为成功（ok: true），返回成功值；
 * 如果结果为失败（ok: false），将错误码映射为 TRPCError 并抛出。
 * 在 tRPC 路由中可直接使用，简化错误处理样板代码。
 */
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
    // 优先使用显式 code，其次尝试从数字 status 映射，最终回退到 BAD_REQUEST
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
