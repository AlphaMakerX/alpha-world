import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { ItemStack } from "@/server/features/building/domain/value-objects/item-stack";
import { createItemStack } from "@/server/features/building/domain/value-objects/item-stack";

export type FactoryProductionJobStatus = "in_progress" | "collected" | "cancelled";

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

export class FactoryProductionJob {
  private constructor(private props: FactoryProductionJobProps) {}

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

  static rehydrate(props: FactoryProductionJobProps): FactoryProductionJob {
    return new FactoryProductionJob({
      ...props,
      inputs: props.inputs.map(createItemStack),
      outputs: props.outputs.map(createItemStack),
    });
  }

  ensureOwner(userId: string): void {
    if (this.props.ownerUserId !== userId) {
      throw new DomainError("只能操作自己的生产任务");
    }
  }

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
