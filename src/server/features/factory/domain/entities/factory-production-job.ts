/**
 * 工厂生产任务领域实体
 *
 * 定义工厂生产任务的核心领域模型。一个生产任务代表在某个工厂建筑中，
 * 按照指定配方将输入材料转化为输出产物的过程，具有开始时间和完成时间。
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { ItemStack } from "@/server/features/item/domain/value-objects/item-stack";
import { createItemStack } from "@/server/features/item/domain/value-objects/item-stack";

/** 生产任务状态：进行中 | 已收取 | 已取消 */
export type FactoryProductionJobStatus = "in_progress" | "collected" | "cancelled";

/** 生产任务实体的内部属性 */
type FactoryProductionJobProps = {
  id: number;
  buildingId: number;
  ownerUserId: string;
  recipeId: string;
  inputs: ItemStack[];
  outputs: ItemStack[];
  status: FactoryProductionJobStatus;
  startedAt: Date;
  finishAt: Date;
  collectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 工厂生产任务领域实体类
 *
 * 采用私有构造函数模式：
 * - start: 开启新生产任务时使用
 * - rehydrate: 从持久化数据重建实体时使用
 */
export class FactoryProductionJob {
  private constructor(private props: FactoryProductionJobProps) {}

  /** 开启新的生产任务，自动计算完成时间 */
  static start(input: {
    id: number;
    buildingId: number;
    ownerUserId: string;
    recipeId: string;
    inputs: ItemStack[];
    outputs: ItemStack[];
    durationSeconds: number;
  }): FactoryProductionJob {
    if (input.durationSeconds <= 0) {
      throw new DomainError("生产时长必须大于 0");
    }
    const now = new Date();
    // 根据生产时长计算完成时间
    return new FactoryProductionJob({
      id: input.id,
      buildingId: input.buildingId,
      ownerUserId: input.ownerUserId,
      recipeId: input.recipeId,
      inputs: input.inputs.map(createItemStack),
      outputs: input.outputs.map(createItemStack),
      status: "in_progress",
      startedAt: now,
      finishAt: new Date(now.getTime() + input.durationSeconds * 1000),
      collectedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** 从持久化数据恢复生产任务实体 */
  static rehydrate(props: FactoryProductionJobProps): FactoryProductionJob {
    return new FactoryProductionJob({
      ...props,
      inputs: props.inputs.map(createItemStack),
      outputs: props.outputs.map(createItemStack),
    });
  }

  /** 断言当前用户是任务所有者，否则抛出领域错误 */
  ensureOwner(userId: string): void {
    if (this.props.ownerUserId !== userId) {
      throw new DomainError("只能操作自己的生产任务");
    }
  }

  /** 判断在指定时间点是否可以收取产物（状态为进行中且已到完成时间） */
  canCollectAt(now: Date = new Date()): boolean {
    return this.props.status === "in_progress" && now.getTime() >= this.props.finishAt.getTime();
  }

  /** 收取生产产物，将任务状态标记为已收取并返回产出物品列表 */
  collect(now: Date = new Date()): ItemStack[] {
    if (this.props.status !== "in_progress") {
      throw new DomainError("当前生产任务不可收取");
    }
    if (now.getTime() < this.props.finishAt.getTime()) {
      throw new DomainError("生产尚未完成");
    }

    this.props.status = "collected";
    this.props.collectedAt = now;
    this.props.updatedAt = now;
    return this.props.outputs;
  }

  get id() {
    return this.props.id;
  }

  get buildingId() {
    return this.props.buildingId;
  }

  get ownerUserId() {
    return this.props.ownerUserId;
  }

  get recipeId() {
    return this.props.recipeId;
  }

  get inputs() {
    return this.props.inputs;
  }

  get outputs() {
    return this.props.outputs;
  }

  get status() {
    return this.props.status;
  }

  get startedAt() {
    return this.props.startedAt;
  }

  get finishAt() {
    return this.props.finishAt;
  }

  get collectedAt() {
    return this.props.collectedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
