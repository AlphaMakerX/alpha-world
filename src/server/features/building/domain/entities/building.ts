import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import type { FactorySubtype } from "@/server/features/factory/domain/factory-subtype";

/** 建筑类型：住宅 | 工厂 | 商店 | 收购站 */
export type BuildingType = "residential" | "factory" | "shop" | "purchasing_station";

/** 非工厂建筑类型 */
type NonFactoryBuildingType = Exclude<BuildingType, "factory">;

/** 各建筑类型的建造费用 */
const BUILDING_COSTS: Record<NonFactoryBuildingType, number> = {
  residential: 500,
  shop: 600,
  purchasing_station: 700,
};

/** 各工厂子类型的建造费用 */
const FACTORY_COSTS: Record<FactorySubtype, number> = {
  mine: 800,
  lumber_mill: 800,
  textile_mill: 900,
  ranch: 900,
  apothecary: 900,
  waterworks: 600,
  smelter: 1000,
  carpentry: 1000,
  paper_mill: 1000,
  assembler: 1200,
};

/** 建筑状态（目前仅有 active） */
export type BuildingStatus = "active";

/** 建筑实体的内部属性 */
type BuildingProps = {
  id: number;
  plotId: number;
  type: BuildingType;
  subtype: string | null;
  level: number;
  status: BuildingStatus;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 建筑领域实体类
 *
 * 采用私有构造函数模式，通过静态工厂方法创建实例：
 * - construct: 新建建筑时使用
 * - rehydrate: 从持久化数据重建实体时使用
 */
export class Building {
  private constructor(private props: BuildingProps) {}

  /** 创建新建筑实例，自动设置状态为 active 并记录当前时间 */
  static construct(input: {
    plotId: number;
    type: BuildingType;
    subtype?: string;
  }): Building {
    if (input.type === "factory" && !input.subtype) {
      throw new DomainError("工厂类型建筑必须指定子类型");
    }
    const now = new Date();
    return new Building({
      id: 0,
      plotId: input.plotId,
      type: input.type,
      subtype: input.type === "factory" ? (input.subtype ?? null) : null,
      level: 1,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }

  /** 根据建筑类型（和可选子类型）获取建造费用 */
  static getCost(type: BuildingType, subtype?: string): number {
    if (type === "factory") {
      if (!subtype || !(subtype in FACTORY_COSTS)) {
        throw new DomainError(`未知的工厂子类型: ${subtype}`);
      }
      return FACTORY_COSTS[subtype as FactorySubtype];
    }
    return BUILDING_COSTS[type];
  }

  /** 从持久化数据恢复建筑实体（不执行业务校验） */
  static rehydrate(props: BuildingProps): Building {
    return new Building(props);
  }

  /** 断言当前建筑为商店类型，否则抛出领域错误 */
  ensureShop(): void {
    if (this.props.type !== "shop") {
      throw new DomainError("当前建筑不是商店");
    }
  }

  /** 断言当前建筑为收购站类型，否则抛出领域错误 */
  ensurePurchasingStation(): void {
    if (this.props.type !== "purchasing_station") {
      throw new DomainError("当前建筑不是收购站");
    }
  }

  /** 导出实体快照，用于 use case 返回值 */
  toSnapshot() {
    return { ...this.props };
  }

  get id() {
    return this.props.id;
  }

  get plotId() {
    return this.props.plotId;
  }

  get type() {
    return this.props.type;
  }

  get subtype() {
    return this.props.subtype;
  }

  get level() {
    return this.props.level;
  }

  get status() {
    return this.props.status;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
