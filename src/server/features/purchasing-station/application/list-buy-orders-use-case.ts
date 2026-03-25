import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

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
  code: UseCaseErrorCode;
};

export type ListBuyOrdersResult = ListBuyOrdersSuccessResult | ListBuyOrdersFailureResult;

export type ListBuyOrdersCommand = {
  buildingId: number;
};

export type ListBuyOrdersUseCaseDeps = {
  buildingRepository: BuildingRepository;
  buyOrderRepository: BuyOrderRepository;
};

export async function executeListBuyOrdersUseCase(
  command: ListBuyOrdersCommand,
  deps: ListBuyOrdersUseCaseDeps,
): Promise<ListBuyOrdersResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }

  try {
    building.ensurePurchasingStation();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  const orders = await deps.buyOrderRepository.findActiveByBuildingId(command.buildingId);

  return { ok: true, orders };
}
