/**
 * 工厂仓储接口
 *
 * 定义工厂聚合根的持久化契约，供基础设施层实现。
 * 与 BuildingRepository 共享 plot_buildings 表，只关注工厂专属字段。
 */
import type { Factory } from "@/server/features/factory/domain/entities/factory";

/** 工厂仓储接口，提供工厂的查询与持久化能力 */
export interface FactoryRepository {
  /** 按建筑 ID 查找工厂（仅 type='factory' 的记录） */
  findByBuildingId(buildingId: number): Promise<Factory | null>;
  /** 保存（更新）工厂实体（仅更新 level 和 updatedAt） */
  save(factory: Factory): Promise<Factory>;
}
