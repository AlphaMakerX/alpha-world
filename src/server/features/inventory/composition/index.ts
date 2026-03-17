import { z } from "zod";
import {
  executeListMyInventoryUseCase as executeListMyInventoryUseCaseImpl,
  type ListMyInventoryResult,
} from "@/server/features/inventory/application/list-my-inventory-use-case";
import { inventoryRepository } from "@/server/features/inventory/infrastructure";

export const listMyInventorySchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
});

type ListMyInventoryFailureResult = {
  ok: false;
  error: string;
  code: "BAD_REQUEST";
};

export async function executeListMyInventoryUseCase(
  input: unknown,
): Promise<ListMyInventoryResult | ListMyInventoryFailureResult> {
  const parsed = listMyInventorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeListMyInventoryUseCaseImpl(parsed.data, {
    inventoryRepository,
  });
}
