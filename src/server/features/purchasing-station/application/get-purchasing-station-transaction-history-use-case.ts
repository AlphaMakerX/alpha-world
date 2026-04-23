/**
 * 查询收购站交易历史用例
 *
 * 查询指定收购站建筑的历史成交交易记录，
 * 返回最近 50 条交易信息（卖家、金额、描述等）。
 */

import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { PurchasingStationTransactionQueryRepository } from "@/server/features/purchasing-station/domain/repositories/purchasing-station-transaction-query-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 查询成功的返回结果 */
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

/** 查询失败的返回结果 */
type GetPurchasingStationTransactionHistoryFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 查询收购站交易历史用例的返回结果联合类型 */
export type GetPurchasingStationTransactionHistoryResult =
  | GetPurchasingStationTransactionHistorySuccessResult
  | GetPurchasingStationTransactionHistoryFailureResult;

/** 查询收购站交易历史命令参数 */
export type GetPurchasingStationTransactionHistoryCommand = {
  /** 收购站建筑 ID */
  buildingId: number;
};

/** 查询收购站交易历史用例的依赖 */
export type GetPurchasingStationTransactionHistoryUseCaseDeps = {
  buildingRepository: BuildingRepository;
  purchasingStationTransactionQueryRepository: PurchasingStationTransactionQueryRepository;
};

/**
 * 执行查询收购站交易历史用例
 *
 * 流程：校验建筑存在 -> 确认建筑为收购站类型 -> 查询最近 50 条交易记录
 */
export async function executeGetPurchasingStationTransactionHistoryUseCase(
  command: GetPurchasingStationTransactionHistoryCommand,
  deps: GetPurchasingStationTransactionHistoryUseCaseDeps,
): Promise<GetPurchasingStationTransactionHistoryResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }

  try {
    // 确认该建筑是收购站类型
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
