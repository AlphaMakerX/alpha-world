/**
 * 建筑仓储接口
 *
 * 定义建筑聚合根的持久化契约，供基础设施层实现。
 */
import type { Building } from "@/server/features/building/domain/entities/building";

/** 建筑仓储接口，提供建筑的查询与持久化能力 */
export interface BuildingRepository {
  /** 按建筑 ID 查找 */
  findById(id: number): Promise<Building | null>;
  /** 按地块 ID 查找（一个地块最多一栋建筑） */
  findByPlotId(plotId: number): Promise<Building | null>;
  /** 批量按地块 ID 查找，返回 plotId -> Building 的映射 */
  findByPlotIds(plotIds: number[]): Promise<Map<number, Building>>;
  /** 查找某用户名下所有建筑 */
  findByOwnerUserId(ownerUserId: string): Promise<Building[]>;
  /** 保存（新增或更新）建筑实体 */
  save(building: Building): Promise<Building>;
}
