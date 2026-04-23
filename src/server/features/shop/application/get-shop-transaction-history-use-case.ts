/**
 * 查询商店交易历史用例
 *
 * 查询指定商店建筑的历史购买交易记录，
 * 返回最近 50 条交易信息（买家、金额、描述等）。
 */

import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { ShopTransactionQueryRepository } from "@/server/features/shop/domain/repositories/shop-transaction-query-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 查询成功的返回结果 */
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

/** 查询失败的返回结果 */
type GetShopTransactionHistoryFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 查询交易历史用例的返回结果联合类型 */
export type GetShopTransactionHistoryResult =
  | GetShopTransactionHistorySuccessResult
  | GetShopTransactionHistoryFailureResult;

/** 查询交易历史命令参数 */
export type GetShopTransactionHistoryCommand = {
  /** 商店建筑 ID */
  buildingId: number;
};

/** 查询交易历史用例的依赖 */
export type GetShopTransactionHistoryUseCaseDeps = {
  buildingRepository: BuildingRepository;
  shopTransactionQueryRepository: ShopTransactionQueryRepository;
};

/**
 * 执行查询商店交易历史用例
 *
 * 流程：校验建筑存在 -> 确认建筑为商店类型 -> 查询最近 50 条交易记录
 */
export async function executeGetShopTransactionHistoryUseCase(
  command: GetShopTransactionHistoryCommand,
  deps: GetShopTransactionHistoryUseCaseDeps,
): Promise<GetShopTransactionHistoryResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }

  try {
    // 确认该建筑是商店类型
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
