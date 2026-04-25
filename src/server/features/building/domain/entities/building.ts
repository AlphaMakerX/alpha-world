import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import {
  type FactorySubtype,
  isValidFactorySubtype,
  MAX_FACTORY_LEVEL,
} from "@/server/features/building/domain/factory-subtype";

/** 建筑类型：住宅 | 工厂 | 商店 | 收购站 */
export type BuildingType = "residential" | "factory" | "shop" | "purchasing_station";

/** 建筑状态（目前仅有 active） */
export type BuildingStatus = "active";

/** 建筑实体的内部属性 */
type BuildingProps = {
  id: number;
  plotId: number;
  type: BuildingType;
  subtype: FactorySubtype | null;
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
    id: number;
    plotId: number;
    type: BuildingType;
    subtype?: FactorySubtype;
  }): Building {
    if (input.type === "factory") {
      if (!input.subtype) {
        throw new DomainError("工厂类型建筑必须指定子类型");
      }
      if (!isValidFactorySubtype(input.subtype)) {
        throw new DomainError(`无效的工厂子类型: ${input.subtype}`);
      }
    }

    const now = new Date();
    return new Building({
      id: input.id,
      plotId: input.plotId,
      type: input.type,
      subtype: input.type === "factory" ? input.subtype! : null,
      level: 1,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }

  /** 从持久化数据恢复建筑实体（不执行业务校验） */
  static rehydrate(props: BuildingProps): Building {
    return new Building(props);
  }

  /** 断言当前建筑为工厂类型，否则抛出领域错误；成功时返回工厂子类型 */
  ensureFactory(): FactorySubtype {
    if (this.props.type !== "factory" || !this.props.subtype) {
      throw new DomainError("当前建筑不是工厂");
    }
    return this.props.subtype;
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

  /** 升级工厂等级 */
  upgrade(): void {
    this.ensureFactory();
    if (this.props.level >= MAX_FACTORY_LEVEL) {
      throw new DomainError("已达最高等级");
    }
    this.props.level += 1;
    this.props.updatedAt = new Date();
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
