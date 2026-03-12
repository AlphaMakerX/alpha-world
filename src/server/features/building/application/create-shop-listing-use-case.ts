import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { buildingRepository, inventoryRepository, shopListingRepository } from "@/server/features/building/infrastructure";
import { normalizeItemKey } from "@/server/features/building/domain";
import { plotRepository } from "@/server/features/plot/infrastructure";

const createShopListingSchema = z.object({
  sellerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  itemKey: z.string().trim().min(1, "物品标识不能为空"),
  quantity: z.number().int().positive("上架数量必须大于 0"),
  unitPrice: z.number().nonnegative("单价不能小于 0"),
});

type CreateShopListingSuccessResult = {
  ok: true;
  listing: {
    id: number;
    buildingId: number;
    sellerUserId: string;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    status: "active" | "sold" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
  };
};

type CreateShopListingFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type CreateShopListingResult = CreateShopListingSuccessResult | CreateShopListingFailureResult;

export async function executeCreateShopListingUseCase(
  input: unknown,
): Promise<CreateShopListingResult> {
  const parsed = createShopListingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const building = await buildingRepository.findById(parsed.data.buildingId);
  if (!building) {
    return {
      ok: false,
      error: "建筑不存在",
      status: 404,
    };
  }

  try {
    const plot = await plotRepository.findById(building.plotId);
    if (!plot) {
      return {
        ok: false,
        error: "地块不存在",
        status: 404,
      };
    }
    if (plot.ownerUserId !== parsed.data.sellerUserId) {
      return {
        ok: false,
        error: "只能操作自己地块上的商店",
        status: 409,
      };
    }
    building.ensureShop();

    const normalizedItemKey = normalizeItemKey(parsed.data.itemKey);
    const quantity = await inventoryRepository.getItemQuantity(
      parsed.data.sellerUserId,
      normalizedItemKey,
    );
    if (quantity < parsed.data.quantity) {
      return {
        ok: false,
        error: "库存不足，无法上架",
        status: 409,
      };
    }

    await inventoryRepository.consumeItem(
      parsed.data.sellerUserId,
      normalizedItemKey,
      parsed.data.quantity,
    );

    const listing = await shopListingRepository.create({
      buildingId: building.id,
      sellerUserId: parsed.data.sellerUserId,
      itemKey: normalizedItemKey,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
      status: "active",
    });

    return {
      ok: true,
      listing,
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        ok: false,
        error: error.message,
        status: 409,
      };
    }
    throw error;
  }
}
