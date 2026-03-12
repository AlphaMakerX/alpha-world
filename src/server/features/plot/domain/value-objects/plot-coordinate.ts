import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

export class PlotCoordinate {
  private constructor(
    private readonly x: number,
    private readonly y: number,
  ) {}

  static create(x: number, y: number): PlotCoordinate {
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw new DomainError("地块坐标必须是整数");
    }
    return new PlotCoordinate(x, y);
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }

  toKey() {
    return `${this.x}:${this.y}`;
  }
}
