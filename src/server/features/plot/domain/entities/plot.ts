import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { PlotCoordinate } from "@/server/features/plot/domain/value-objects/plot-coordinate";

export type PlotStatus = "available" | "owned" | "locked";

type PlotProps = {
  id: number;
  coordinate: PlotCoordinate;
  ownerUserId: string | null;
  status: PlotStatus;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export class Plot {
  private constructor(private props: PlotProps) {}

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

  static rehydrate(props: PlotProps): Plot {
    return new Plot(props);
  }

  purchaseBy(userId: string): void {
    if (this.props.status !== "available") {
      throw new DomainError("当前地块不可购买");
    }
    this.props.ownerUserId = userId;
    this.props.status = "owned";
    this.props.updatedAt = new Date();
  }

  lock(): void {
    this.props.status = "locked";
    this.props.updatedAt = new Date();
  }

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
