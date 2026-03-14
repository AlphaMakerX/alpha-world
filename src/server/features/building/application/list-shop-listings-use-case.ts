import { z } from "zod";
import { buildingRepository, shopListingRepository } from "@/server/features/building/infrastructure";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

const listShopListingsSchema = z.object({
  buildingId: z.number().int().positive(),
});

type ListShopListingsSuccessResult = {
  ok: true;
  listings: Array<{
    id: number;
    buildingId: number;
    sellerUserId: string;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    status: "active" | "sold" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
  }>;
};

type ListShopListingsFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type ListShopListingsResult = ListShopListingsSuccessResult | ListShopListingsFailureResult;

export async function executeListShopListingsUseCase(
  input: unknown,
): Promise<ListShopListingsResult> {
  const parsed = listShopListingsSchema.safeParse(input);
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
    building.ensureShop();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, status: 409 };
    }
    throw error;
  }

  const listings = await shopListingRepository.findActiveByBuildingId(parsed.data.buildingId);

  return {
    ok: true,
    listings,
  };
}
