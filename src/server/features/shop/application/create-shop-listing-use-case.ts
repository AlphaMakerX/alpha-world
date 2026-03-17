import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { normalizeItemKey } from "@/server/features/item/domain/value-objects/item-stack";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { ShopListingRepository } from "@/server/features/shop/domain/repositories/shop-listing-repository";
import type { InventoryRepository } from "@/server/features/inventory/domain/repositories/inventory-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

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
  code: UseCaseErrorCode;
};

export type CreateShopListingResult = CreateShopListingSuccessResult | CreateShopListingFailureResult;

export type CreateShopListingCommand = {
  sellerUserId: string;
  buildingId: number;
  itemKey: string;
  quantity: number;
  unitPrice: number;
};

export type CreateShopListingUseCaseDeps = {
  buildingRepository: BuildingRepository;
  shopListingRepository: ShopListingRepository;
  inventoryRepository: InventoryRepository;
  plotRepository: PlotRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executeCreateShopListingUseCase(
  command: CreateShopListingCommand,
  deps: CreateShopListingUseCaseDeps,
): Promise<CreateShopListingResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return {
      ok: false,
      error: "建筑不存在",
      code: "NOT_FOUND",
    };
  }

  try {
    const plot = await deps.plotRepository.findById(building.plotId);
    if (!plot) {
      return {
        ok: false,
        error: "地块不存在",
        code: "NOT_FOUND",
      };
    }
    if (plot.ownerUserId !== command.sellerUserId) {
      return {
        ok: false,
        error: "只能操作自己地块上的商店",
        code: "CONFLICT",
      };
    }
    building.ensureShop();

    const normalizedItemKey = normalizeItemKey(command.itemKey);
    const quantity = await deps.inventoryRepository.getItemQuantity(command.sellerUserId, normalizedItemKey);
    if (quantity < command.quantity) {
      return {
        ok: false,
        error: "库存不足，无法上架",
        code: "CONFLICT",
      };
    }

    const listing = await deps.transact(async () => {
      await deps.inventoryRepository.consumeItem(
        command.sellerUserId,
        normalizedItemKey,
        command.quantity,
      );

      return deps.shopListingRepository.create({
        buildingId: building.id,
        sellerUserId: command.sellerUserId,
        itemKey: normalizedItemKey,
        quantity: command.quantity,
        unitPrice: command.unitPrice,
        status: "active",
      });
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
        code: "CONFLICT",
      };
    }
    throw error;
  }
}
