/**
 * 工厂生产任务仓储接口
 *
 * 定义生产任务聚合根的持久化契约，供基础设施层实现。
 */
import type { FactoryProductionJob } from "@/server/features/factory/domain/entities/factory-production-job";

/** 工厂生产任务仓储接口 */
export interface FactoryProductionJobRepository {
  /** 按任务 ID 查找 */
  findById(id: number): Promise<FactoryProductionJob | null>;
  /** 查找指定建筑中正在进行的生产任务（同一建筑同时只允许一个进行中的任务） */
  findInProgressByBuildingId(buildingId: number): Promise<FactoryProductionJob | null>;
  /** 查找指定建筑的所有生产任务（含历史） */
  findByBuildingId(buildingId: number): Promise<FactoryProductionJob[]>;
  /** 保存（新增或更新）生产任务 */
  save(job: FactoryProductionJob): Promise<FactoryProductionJob>;
}
