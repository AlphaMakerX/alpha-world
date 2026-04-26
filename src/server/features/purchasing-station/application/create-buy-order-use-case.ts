/**
 * 创建收购订单用例
 *
 * 收购方在自己地块的收购站建筑上发布收购订单。
 * 创建时会预先从收购方账户扣除总金额（单价 * 数量）作为冻结资金，
 * 并创建状态为进行中的收购订单。
 */

import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { normalizeItemKey } from "@/server/features/item/domain/value-objects/item-stack";
import type { Building } from "@/server/features/building/domain";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import type { User } from "@/server/features/person/domain/entities/user";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { FinanceService } from "@/server/features/finance/domain/finance-service";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 创建收购订单成功的返回结果 */
type CreateBuyOrderSuccessResult = {
  ok: true;
  order: {
    id: number;
    buildingId: number;
    buyerUserId: string;
    itemKey: string;
    quantity: number;
    unitPrice: number;
    status: "active" | "fulfilled" | "cancelled";
    createdAt: Date;
    updatedAt: Date;
  };
};

/** 创建收购订单失败的返回结果 */
type CreateBuyOrderFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

/** 创建收购订单用例的返回结果联合类型 */
export type CreateBuyOrderResult = CreateBuyOrderSuccessResult | CreateBuyOrderFailureResult;

/** 创建收购订单命令参数 */
export type CreateBuyOrderCommand = {
  /** 收购方用户 ID */
  buyerUserId: string;
  /** 目标收购站建筑 ID */
  buildingId: number;
  /** 物品标识键 */
  itemKey: string;
  /** 收购数量 */
  quantity: number;
  /** 单价 */
  unitPrice: number;
};

/** 创建收购订单用例的依赖 */
export type CreateBuyOrderUseCaseDeps = {
  buildingRepository: BuildingRepository;
  buyOrderRepository: BuyOrderRepository;
  userRepository: UserRepository;
  financeService: FinanceService;
  plotRepository: PlotRepository;
  /** 事务执行器，确保扣款和创建订单的原子性 */
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

/** validate 返回的已校验上下文，包含业务逻辑所需的数据 */
type ValidatedContext = {
  building: Building;
  buyer: User;
  totalCost: number;
  normalizedItemKey: string;
};

async function validate(
  command: CreateBuyOrderCommand,
  deps: CreateBuyOrderUseCaseDeps,
): Promise<ValidatedContext | CreateBuyOrderFailureResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }

  // 校验地块存在且归属于收购方
  const plot = await deps.plotRepository.findById(building.plotId);
  if (!plot) {
    return { ok: false, error: "地块不存在", code: "NOT_FOUND" };
  }
  if (plot.ownerUserId !== command.buyerUserId) {
    return { ok: false, error: "只能操作自己地块上的收购站", code: "CONFLICT" };
  }
  // 确认该建筑是收购站类型，否则抛出 DomainError
  building.ensurePurchasingStation();

  const buyer = await deps.userRepository.findById(command.buyerUserId);
  if (!buyer) {
    return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
  }

  // 计算总冻结金额并标准化物品键
  const totalCost = command.unitPrice * command.quantity;
  const normalizedItemKey = normalizeItemKey(command.itemKey);

  return { building, buyer, totalCost, normalizedItemKey };
}

function isFailure(
  result: ValidatedContext | CreateBuyOrderFailureResult,
): result is CreateBuyOrderFailureResult {
  return "ok" in result;
}

/**
 * 执行创建收购订单用例
 *
 * 流程：校验建筑存在 -> 校验地块归属 -> 确认建筑为收购站类型
 * -> 校验收购方余额充足 -> 事务中扣款并创建收购订单
 */
export async function executeCreateBuyOrderUseCase(
  command: CreateBuyOrderCommand,
  deps: CreateBuyOrderUseCaseDeps,
): Promise<CreateBuyOrderResult> {
  try {
    const validated = await validate(command, deps);
    if (isFailure(validated)) return validated;
    const { building, buyer, totalCost, normalizedItemKey } = validated;

    // 事务：从收购方冻结总金额 + 创建收购订单
    const order = await deps.transact(async () => {
      await deps.financeService.freeze({ payer: buyer, amount: totalCost });

      return deps.buyOrderRepository.create({
        buildingId: building.id,
        buyerUserId: command.buyerUserId,
        itemKey: normalizedItemKey,
        quantity: command.quantity,
        unitPrice: command.unitPrice,
        status: "active",
      });
    });

    return { ok: true, order };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, code: "CONFLICT" };
    }
    throw error;
  }
}
