import { z } from "zod";
import { inventoryRepository } from "@/server/features/building/infrastructure";

const listMyInventorySchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
});

export async function executeListMyInventoryUseCase(input: unknown) {
  const parsed = listMyInventorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400 as const,
    };
  }

  const items = await inventoryRepository.getByOwner(parsed.data.ownerUserId);
  return {
    ok: true as const,
    items,
  };
}
