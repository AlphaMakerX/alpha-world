/**
 * 工厂领域实体
 *
 * 从 Building 实体中提取的工厂专属领域概念，拥有工厂子类型、等级和升级逻辑。
 * 与 Building 共享 plot_buildings 表，各自关注不同字段。
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { type FactorySubtype, MAX_FACTORY_LEVEL } from "@/server/features/factory/domain/factory-subtype";

/** 工厂实体的内部属性 */
type FactoryProps = {
  id: number;          // 即 building.id
  plotId: number;
  subtype: FactorySubtype;
  level: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 工厂领域实体类
 *
 * 采用私有构造函数模式，通过静态工厂方法创建实例：
 * - rehydrate: 从持久化数据重建实体时使用
 */
export class Factory {
  private constructor(private props: FactoryProps) {}

  /** 从持久化数据恢复工厂实体（不执行业务校验） */
  static rehydrate(props: FactoryProps): Factory {
    return new Factory(props);
  }

  /** 升级工厂等级 */
  upgrade(): void {
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

  get subtype() {
    return this.props.subtype;
  }

  get level() {
    return this.props.level;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
