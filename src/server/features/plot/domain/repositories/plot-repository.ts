/**
 * 地块仓储接口（领域层）
 *
 * 定义地块聚合根的持久化操作契约，由基础设施层实现。
 */
import type { Plot } from "@/server/features/plot/domain/entities/plot";
import type { PlotCoordinate } from "@/server/features/plot/domain/value-objects/plot-coordinate";

/** 地块仓储接口 */
export interface PlotRepository {
  /** 查询所有地块 */
  findAll(): Promise<Plot[]>;
  /** 根据地块 ID 查找 */
  findById(id: number): Promise<Plot | null>;
  /** 根据坐标查找地块 */
  findByCoordinate(coordinate: PlotCoordinate): Promise<Plot | null>;
  /** 保存地块（新增或更新） */
  save(plot: Plot): Promise<void>;
}
