import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PurchasingStationTransactionQueryRepository } from "@/server/features/purchasing-station/domain/repositories/purchasing-station-transaction-query-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

type GetPurchasingStationTransactionHistorySuccessResult = {
  ok: true;
  transactions: Array<{
    id: number;
    sellerUsername: string;
    amount: number;
    description: string | null;
    createdAt: Date;
  }>;
};

type GetPurchasingStationTransactionHistoryFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type GetPurchasingStationTransactionHistoryResult =
  | GetPurchasingStationTransactionHistorySuccessResult
  | GetPurchasingStationTransactionHistoryFailureResult;

export type GetPurchasingStationTransactionHistoryCommand = {
  buildingId: number;
};

export type GetPurchasingStationTransactionHistoryUseCaseDeps = {
  buildingRepository: BuildingRepository;
  purchasingStationTransactionQueryRepository: PurchasingStationTransactionQueryRepository;
};

export async function executeGetPurchasingStationTransactionHistoryUseCase(
  command: GetPurchasingStationTransactionHistoryCommand,
  deps: GetPurchasingStationTransactionHistoryUseCaseDeps,
): Promise<GetPurchasingStationTransactionHistoryResult> {
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

  const transactions = await deps.purchasingStationTransactionQueryRepository.listByBuildingId(
    command.buildingId,
    50,
  );

  return {
    ok: true,
    transactions,
  };
}
