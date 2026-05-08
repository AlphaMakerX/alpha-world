/**
 * 财务模块组合根（Composition Root）
 *
 * 负责将财务相关用例与具体的基础设施实现进行组装：
 * - 定义输入校验 Schema（Zod）
 * - 注入仓储、服务等依赖后，对外暴露可直接调用的用例函数
 */

import { z } from "zod";
import {
  executeTransferMoneyUseCase as executeTransferMoneyUseCaseImpl,
} from "@/server/features/finance/application/transfer-money-use-case";
import { userRepository } from "@/server/features/person/infrastructure";
import { financeService } from "@/server/features/finance";
import { transact } from "@/server/lib/db";

/** 转账输入校验 Schema */
export const transferMoneySchema = z.object({
  payerUserId: z.string().uuid("用户 ID 不合法"),
  toUsername: z.string().trim().min(3, "用户名至少 3 位").max(32, "用户名最多 32 位"),
  amount: z.number().positive("转账金额必须大于 0"),
  description: z.string().max(200, "描述最多 200 字").optional(),
});

/**
 * 执行转账用例（已注入依赖）
 */
export async function executeTransferMoneyUseCase(
  input: z.infer<typeof transferMoneySchema>,
) {
  return executeTransferMoneyUseCaseImpl(input, {
    userRepository,
    financeService,
    transact,
  });
}
