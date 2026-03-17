import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { buyOrderRepository } from "@/server/features/purchasing-station/infrastructure";
import { normalizeItemKey } from "@/server/features/item/domain/value-objects/item-stack";
import { userRepository } from "@/server/features/person/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";

const createBuyOrderSchema = z.object({
  buyerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  itemKey: z.string().trim().min(1, "物品标识不能为空"),
  quantity: z.number().int().positive("收购数量必须大于 0"),
  unitPrice: z.number().positive("单价必须大于 0"),
});

type CreateBuyOrderSuccessResult = {
  ok: true;
  order: {
    id: number;
    buildingId: number;
    buyerUserId: string;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    status: "active" | "fulfilled" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
  };
};

type CreateBuyOrderFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type CreateBuyOrderResult = CreateBuyOrderSuccessResult | CreateBuyOrderFailureResult;

export async function executeCreateBuyOrderUseCase(
  input: unknown,
): Promise<CreateBuyOrderResult> {
  const parsed = createBuyOrderSchema.safeParse(input);
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
    const plot = await plotRepository.findById(building.plotId);
    if (!plot) {
      return { ok: false, error: "地块不存在", status: 404 };
    }
    if (plot.ownerUserId !== parsed.data.buyerUserId) {
      return { ok: false, error: "只能操作自己地块上的收购站", status: 409 };
    }
    building.ensurePurchasingStation();

    const buyer = await userRepository.findById(parsed.data.buyerUserId);
    if (!buyer) {
      return { ok: false, error: "用户不存在", status: 404 };
    }

    const totalCost = parsed.data.unitPrice * parsed.data.quantity;
    buyer.spendMoney(totalCost);
    await userRepository.save(buyer);

    const normalizedItemKey = normalizeItemKey(parsed.data.itemKey);
    const order = await buyOrderRepository.create({
      buildingId: building.id,
      buyerUserId: parsed.data.buyerUserId,
      itemKey: normalizedItemKey,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
      status: "active",
    });

    return { ok: true, order };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, status: 409 };
    }
    throw error;
  }
}
