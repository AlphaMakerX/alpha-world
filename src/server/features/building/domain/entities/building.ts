import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

export type BuildingType = "residential" | "factory" | "shop";
export type BuildingStatus = "active";

type BuildingProps = {
  id: number;
  plotId: number;
  type: BuildingType;
  status: BuildingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class Building {
  private constructor(private props: BuildingProps) {}

  static construct(input: {
    id: number;
    plotId: number;
    type: BuildingType;
  }): Building {
    const now = new Date();
    return new Building({
      id: input.id,
      plotId: input.plotId,
      type: input.type,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: BuildingProps): Building {
    return new Building(props);
  }

  ensureFactory(): void {
    if (this.props.type !== "factory") {
      throw new DomainError("当前建筑不是工厂");
    }
  }

  ensureShop(): void {
    if (this.props.type !== "shop") {
      throw new DomainError("当前建筑不是商店");
    }
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
