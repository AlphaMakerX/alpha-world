/**
 * 查询收购站进行中的收购订单列表用例
 *
 * 查询指定收购站建筑中所有当前进行中的收购订单列表。
 */

import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { ItemKey } from "@/server/features/item/item-catalog";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 查询成功的返回结果 */
type ListBuyOrdersSuccessResult = {
  ok: true;
  orders: Array<{
    id: number;
    buildingId: number;
    buyerUserId: string;
    itemKey: ItemKey;
    quantity: number;
    unitPrice: number;
    status: "active" | "fulfilled" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
  }>;
};

/** 查询失败的返回结果 */
type ListBuyOrdersFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 查询收购订单列表用例的返回结果联合类型 */
export type ListBuyOrdersResult = ListBuyOrdersSuccessResult | ListBuyOrdersFailureResult;

/** 查询收购订单列表命令参数 */
export type ListBuyOrdersCommand = {
  /** 收购站建筑 ID */
  buildingId: number;
};

/** 查询收购订单列表用例的依赖 */
export type ListBuyOrdersUseCaseDeps = {
  buildingRepository: BuildingRepository;
  buyOrderRepository: BuyOrderRepository;
};

/**
 * 执行查询收购站进行中的收购订单列表用例
 *
 * 流程：校验建筑存在 -> 确认建筑为收购站类型 -> 查询所有进行中的订单
 */
export async function executeListBuyOrdersUseCase(
  command: ListBuyOrdersCommand,
  deps: ListBuyOrdersUseCaseDeps,
): Promise<ListBuyOrdersResult> {
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

  const orders = await deps.buyOrderRepository.findActiveByBuildingId(command.buildingId);

  return { ok: true, orders };
}
