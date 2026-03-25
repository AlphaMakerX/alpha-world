import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { ShopListingRepository } from "@/server/features/shop/domain/repositories/shop-listing-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

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
  code: UseCaseErrorCode;
};

export type ListShopListingsResult = ListShopListingsSuccessResult | ListShopListingsFailureResult;

export type ListShopListingsCommand = {
  buildingId: number;
};

export type ListShopListingsUseCaseDeps = {
  buildingRepository: BuildingRepository;
  shopListingRepository: ShopListingRepository;
};

export async function executeListShopListingsUseCase(
  command: ListShopListingsCommand,
  deps: ListShopListingsUseCaseDeps,
): Promise<ListShopListingsResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return {
      ok: false,
      error: "建筑不存在",
      code: "NOT_FOUND",
    };
  }

  try {
    building.ensureShop();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  const listings = await deps.shopListingRepository.findActiveByBuildingId(command.buildingId);

  return {
    ok: true,
    listings,
  };
}
