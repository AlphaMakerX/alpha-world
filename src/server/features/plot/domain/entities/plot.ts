/**
 * 地块领域实体
 *
 * 定义地块的核心属性与行为，包括创建、购买、锁定/解锁等状态流转。
 * 地块是游戏世界中的基本空间单位，玩家可以购买并在其上建造建筑。
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { PlotCoordinate } from "@/server/features/plot/domain/value-objects/plot-coordinate";

/** 地块状态：可购买 | 已拥有 | 已锁定 */
export type PlotStatus = "available" | "owned" | "locked";

/** 地块实体内部属性 */
type PlotProps = {
  id: number;
  coordinate: PlotCoordinate;
  ownerUserId: string | null;
  status: PlotStatus;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

/** 地块聚合根实体 */
export class Plot {
  private constructor(private props: PlotProps) {}

  /** 创建一个可购买状态的新地块 */
  static createAvailable(input: {
    id: number;
    x: number;
    y: number;
    price: number;
  }): Plot {
    if (input.price < 0) {
      throw new DomainError("地块价格不能小于 0");
    }
    const now = new Date();
    return new Plot({
      id: input.id,
      coordinate: PlotCoordinate.create(input.x, input.y),
      ownerUserId: null,
      status: "available",
      price: input.price,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** 从持久化数据重建地块实体 */
  static rehydrate(props: PlotProps): Plot {
    return new Plot(props);
  }

  /** 用户购买地块，仅当状态为 available 时允许 */
  purchaseBy(userId: string): void {
    if (this.props.status !== "available") {
      throw new DomainError("当前地块不可购买");
    }
    this.props.ownerUserId = userId;
    this.props.status = "owned";
    this.props.updatedAt = new Date();
  }

  /** 锁定地块（禁止购买） */
  lock(): void {
    this.props.status = "locked";
    this.props.updatedAt = new Date();
  }

  /** 解锁地块，恢复为 owned 或 available 状态 */
  unlock(): void {
    this.props.status = this.props.ownerUserId ? "owned" : "available";
    this.props.updatedAt = new Date();
  }

  get id() {
    return this.props.id;
  }

  get coordinate() {
    return this.props.coordinate;
  }

  get ownerUserId() {
    return this.props.ownerUserId;
  }

  get status() {
    return this.props.status;
  }

  get price() {
    return this.props.price;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
