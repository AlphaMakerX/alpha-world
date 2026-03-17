import { z } from "zod";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { buyOrderRepository } from "@/server/features/purchasing-station/infrastructure";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

const listBuyOrdersSchema = z.object({
  buildingId: z.number().int().positive(),
});

type ListBuyOrdersSuccessResult = {
  ok: true;
  orders: Array<{
    id: number;
    buildingId: number;
    buyerUserId: string;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    status: "active" | "fulfilled" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
  }>;
};

type ListBuyOrdersFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type ListBuyOrdersResult = ListBuyOrdersSuccessResult | ListBuyOrdersFailureResult;

export async function executeListBuyOrdersUseCase(
  input: unknown,
): Promise<ListBuyOrdersResult> {
  const parsed = listBuyOrdersSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const building = await buildingRepository.findById(parsed.data.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", status: 404 };
  }

  try {
    building.ensurePurchasingStation();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, status: 409 };
    }
    throw error;
  }

  const orders = await buyOrderRepository.findActiveByBuildingId(parsed.data.buildingId);

  return { ok: true, orders };
}
