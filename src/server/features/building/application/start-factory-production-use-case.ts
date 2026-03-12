import { z } from "zod";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { FactoryProductionJob } from "@/server/features/building/domain";
import {
  buildingRepository,
  factoryProductionJobRepository,
  inventoryRepository,
} from "@/server/features/building/infrastructure";
import { getFactoryRecipeById } from "@/server/features/building/application/factory-recipe-catalog";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { userRepository } from "@/server/features/person/infrastructure";

const startFactoryProductionSchema = z.object({
  ownerUserId: z.string().uuid("用户 ID 不合法"),
  buildingId: z.number().int().positive(),
  recipeId: z.string().trim().min(1, "配方 ID 不能为空"),
});

type StartFactoryProductionSuccessResult = {
  ok: true;
  job: {
    id: number;
    buildingId: number;
    ownerUserId: string;
    recipeId: string;
    status: "in_progress" | "collected" | "cancelled";
    startedAt: Date;
    finishAt: Date;
  };
};

type StartFactoryProductionFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type StartFactoryProductionResult =
  | StartFactoryProductionSuccessResult
  | StartFactoryProductionFailureResult;

export async function executeStartFactoryProductionUseCase(
  input: unknown,
): Promise<StartFactoryProductionResult> {
  const parsed = startFactoryProductionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const building = await buildingRepository.findById(parsed.data.buildingId);
  if (!building) {
    return {
      ok: false,
      error: "建筑不存在",
      status: 404,
    };
  }

  const recipe = getFactoryRecipeById(parsed.data.recipeId);
  if (!recipe) {
    return {
      ok: false,
      error: "配方不存在",
      status: 404,
    };
  }

  const inProgressJob = await factoryProductionJobRepository.findInProgressByBuildingId(building.id);
  if (inProgressJob) {
    return {
      ok: false,
      error: "工厂已有进行中的生产任务",
      status: 409,
    };
  }

  try {
    const plot = await plotRepository.findById(building.plotId);
    if (!plot) {
      return {
        ok: false,
        error: "地块不存在",
        status: 404,
      };
    }
    if (plot.ownerUserId !== parsed.data.ownerUserId) {
      return {
        ok: false,
        error: "只能操作自己地块上的工厂",
        status: 409,
      };
    }
    building.ensureFactory();

    const moneyCost = recipe.inputs
      .filter((inputItem) => inputItem.itemKey === "money")
      .reduce((sum, inputItem) => sum + inputItem.quantity, 0);
    const ownerUser = moneyCost > 0 ? await userRepository.findById(parsed.data.ownerUserId) : null;
    if (moneyCost > 0 && !ownerUser) {
      return {
        ok: false,
        error: "用户不存在",
        status: 404,
      };
    }

    for (const inputItem of recipe.inputs) {
      if (inputItem.itemKey === "money") {
        if ((ownerUser?.money ?? 0) < inputItem.quantity) {
          return {
            ok: false,
            error: "余额不足，无法开始生产",
            status: 409,
          };
        }
        continue;
      }
      const quantity = await inventoryRepository.getItemQuantity(
        parsed.data.ownerUserId,
        inputItem.itemKey,
      );
      if (quantity < inputItem.quantity) {
        return {
          ok: false,
          error: `材料不足: ${inputItem.itemKey}`,
          status: 409,
        };
      }
    }

    for (const inputItem of recipe.inputs) {
      if (inputItem.itemKey === "money") {
        continue;
      }
      await inventoryRepository.consumeItem(
        parsed.data.ownerUserId,
        inputItem.itemKey,
        inputItem.quantity,
      );
    }
    if (ownerUser && moneyCost > 0) {
      ownerUser.spendMoney(moneyCost);
      await userRepository.save(ownerUser);
    }

    const job = FactoryProductionJob.start({
      id: 0,
      buildingId: building.id,
      ownerUserId: parsed.data.ownerUserId,
      recipeId: recipe.id,
      inputs: recipe.inputs,
      outputs: recipe.outputs,
      durationSeconds: recipe.durationSeconds,
    });
    const savedJob = await factoryProductionJobRepository.save(job);

    return {
      ok: true,
      job: {
        id: savedJob.id,
        buildingId: savedJob.buildingId,
        ownerUserId: savedJob.ownerUserId,
        recipeId: savedJob.recipeId,
        status: savedJob.status,
        startedAt: savedJob.startedAt,
        finishAt: savedJob.finishAt,
      },
    };
  } catch (error) {
    if (error instanceof DomainError) {
      return {
        ok: false,
        error: error.message,
        status: 409,
      };
    }
    throw error;
  }
}
