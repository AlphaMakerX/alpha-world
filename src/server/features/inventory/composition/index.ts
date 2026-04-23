/**
 * 库存模块组合根（Composition Root）
 * 负责将应用层用例与基础设施层实现进行组装，
 * 同时处理外部输入的参数校验，对外暴露可直接调用的用例入口。
 */

import { z } from "zod";
import {
  executeListMyInventoryUseCase as executeListMyInventoryUseCaseImpl,
  type ListMyInventoryResult,
} from "@/server/features/inventory/application/list-my-inventory-use-case";
import { inventoryRepository } from "@/server/features/inventory/infrastructure";

/** 查询库存的输入参数校验 schema */
export const listMyInventorySchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
});

/** 查询库存失败时的返回类型 */
type ListMyInventoryFailureResult = {
  ok: false;
  error: string;
  code: "BAD_REQUEST";
};

/**
 * 组合后的查询库存用例入口
 * 接收未经校验的外部输入，完成参数校验后注入依赖并执行用例
 */
export async function executeListMyInventoryUseCase(
  input: unknown,
): Promise<ListMyInventoryResult | ListMyInventoryFailureResult> {
  // 校验输入参数
  const parsed = listMyInventorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  // 注入仓储实例并执行用例
  return executeListMyInventoryUseCaseImpl(parsed.data, {
    inventoryRepository,
  });
}
