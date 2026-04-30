/**
 * 住宅休息任务领域实体
 *
 * 定义住宅休息任务的核心领域模型。一个休息任务代表玩家在某栋住宅中休息，
 * 花费金币和时间来恢复体力。
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

/** 休息任务状态：进行中 | 已收取 */
export type RestJobStatus = "in_progress" | "collected";

/** 休息任务实体的内部属性 */
type RestJobProps = {
  id: number;
  buildingId: number;
  ownerUserId: string;
  resterUserId: string;
  restType: string;
  staminaGain: number;
  cost: number;
  status: RestJobStatus;
  startedAt: Date;
  finishAt: Date;
  collectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 住宅休息任务领域实体类
 *
 * 采用私有构造函数模式：
 * - start: 发起新休息任务时使用
 * - rehydrate: 从持久化数据重建实体时使用
 */
export class RestJob {
  private constructor(private props: RestJobProps) {}

  /** 发起新的休息任务，自动计算完成时间 */
  static start(input: {
    buildingId: number;
    ownerUserId: string;
    resterUserId: string;
    restType: string;
    staminaGain: number;
    cost: number;
    durationSeconds: number;
  }): RestJob {
    if (input.durationSeconds <= 0) {
      throw new DomainError("休息时长必须大于 0");
    }
    if (input.cost < 0) {
      throw new DomainError("休息费用不能为负数");
    }
    if (input.staminaGain <= 0) {
      throw new DomainError("体力恢复量必须大于 0");
    }
    const now = new Date();
    return new RestJob({
      id: 0,
      buildingId: input.buildingId,
      ownerUserId: input.ownerUserId,
      resterUserId: input.resterUserId,
      restType: input.restType,
      staminaGain: input.staminaGain,
      cost: input.cost,
      status: "in_progress",
      startedAt: now,
      finishAt: new Date(now.getTime() + input.durationSeconds * 1000),
      collectedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** 从持久化数据恢复休息任务实体 */
  static rehydrate(props: RestJobProps): RestJob {
    return new RestJob(props);
  }

  /** 判断在指定时间点是否可以收取（状态为进行中且已到完成时间） */
  canCollect(now: Date = new Date()): boolean {
    return this.props.status === "in_progress" && now.getTime() >= this.props.finishAt.getTime();
  }

  /** 收取休息成果，将任务状态标记为已收取 */
  collect(now: Date = new Date()): void {
    if (this.props.status !== "in_progress") {
      throw new DomainError("当前休息任务不可收取");
    }
    if (now.getTime() < this.props.finishAt.getTime()) {
      throw new DomainError("休息尚未完成");
    }
    this.props.status = "collected";
    this.props.collectedAt = now;
    this.props.updatedAt = now;
  }

  /** 断言当前用户是休息发起人，否则抛出领域错误 */
  ensureRester(userId: string): void {
    if (this.props.resterUserId !== userId) {
      throw new DomainError("只能操作自己的休息任务");
    }
  }

  get id() { return this.props.id; }
  get buildingId() { return this.props.buildingId; }
  get ownerUserId() { return this.props.ownerUserId; }
  get resterUserId() { return this.props.resterUserId; }
  get restType() { return this.props.restType; }
  get staminaGain() { return this.props.staminaGain; }
  get cost() { return this.props.cost; }
  get status() { return this.props.status; }
  get startedAt() { return this.props.startedAt; }
  get finishAt() { return this.props.finishAt; }
  get collectedAt() { return this.props.collectedAt; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
