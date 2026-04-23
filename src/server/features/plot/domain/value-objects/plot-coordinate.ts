/**
 * 地块坐标值对象
 *
 * 封装地块在网格中的整数坐标 (x, y)，提供坐标键生成方法。
 * 值对象不可变，坐标必须为整数。
 */
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";

/** 地块坐标值对象，封装网格坐标并校验必须为整数 */
export class PlotCoordinate {
  private constructor(
    private readonly x: number,
    private readonly y: number,
  ) {}

  /** 创建坐标，校验 x 和 y 必须为整数 */
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

  /** 生成坐标唯一键，格式为 "x:y" */
  toKey() {
    return `${this.x}:${this.y}`;
  }
}
