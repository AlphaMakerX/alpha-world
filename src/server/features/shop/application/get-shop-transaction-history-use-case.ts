import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { ShopTransactionQueryRepository } from "@/server/features/shop/domain/repositories/shop-transaction-query-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

type GetShopTransactionHistorySuccessResult = {
  ok: true;
  transactions: Array<{
    id: number;
    buyerUsername: string;
    amount: number;
    description: string | null;
    createdAt: Date;
  }>;
};

type GetShopTransactionHistoryFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type GetShopTransactionHistoryResult =
  | GetShopTransactionHistorySuccessResult
  | GetShopTransactionHistoryFailureResult;

export type GetShopTransactionHistoryCommand = {
  buildingId: number;
};

export type GetShopTransactionHistoryUseCaseDeps = {
  buildingRepository: BuildingRepository;
  shopTransactionQueryRepository: ShopTransactionQueryRepository;
};

export async function executeGetShopTransactionHistoryUseCase(
  command: GetShopTransactionHistoryCommand,
  deps: GetShopTransactionHistoryUseCaseDeps,
): Promise<GetShopTransactionHistoryResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }

  try {
    building.ensureShop();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }

  const transactions = await deps.shopTransactionQueryRepository.listByBuildingId(
    command.buildingId,
    50,
  );

  return {
    ok: true,
    transactions,
  };
}
