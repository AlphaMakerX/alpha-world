import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { normalizeItemKey } from "@/server/features/item/domain/value-objects/item-stack";
import type { BuildingRepository } from "@/server/features/building/domain/repositories/building-repository";
import type { BuyOrderRepository } from "@/server/features/purchasing-station/domain/repositories/buy-order-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { PlotRepository } from "@/server/features/plot/domain/repositories/plot-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

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

type CreateBuyOrderFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type CreateBuyOrderResult = CreateBuyOrderSuccessResult | CreateBuyOrderFailureResult;

export type CreateBuyOrderCommand = {
  buyerUserId: string;
  buildingId: number;
  itemKey: string;
  quantity: number;
  unitPrice: number;
};

export type CreateBuyOrderUseCaseDeps = {
  buildingRepository: BuildingRepository;
  buyOrderRepository: BuyOrderRepository;
  userRepository: UserRepository;
  plotRepository: PlotRepository;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executeCreateBuyOrderUseCase(
  command: CreateBuyOrderCommand,
  deps: CreateBuyOrderUseCaseDeps,
): Promise<CreateBuyOrderResult> {
  const building = await deps.buildingRepository.findById(command.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", code: "NOT_FOUND" };
  }

  try {
    const plot = await deps.plotRepository.findById(building.plotId);
    if (!plot) {
      return { ok: false, error: "地块不存在", code: "NOT_FOUND" };
    }
    if (plot.ownerUserId !== command.buyerUserId) {
      return { ok: false, error: "只能操作自己地块上的收购站", code: "CONFLICT" };
    }
    building.ensurePurchasingStation();

    const buyer = await deps.userRepository.findById(command.buyerUserId);
    if (!buyer) {
      return { ok: false, error: "用户不存在", code: "NOT_FOUND" };
    }

    const totalCost = command.unitPrice * command.quantity;
    const normalizedItemKey = normalizeItemKey(command.itemKey);
    const order = await deps.transact(async () => {
      buyer.spendMoney(totalCost);
      await deps.userRepository.save(buyer);

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
