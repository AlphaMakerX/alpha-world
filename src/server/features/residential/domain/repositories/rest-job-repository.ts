/**
 * 休息任务仓储接口
 *
 * 定义住宅休息任务的持久化契约，供基础设施层实现。
 */
import type { RestJob } from "@/server/features/residential/domain/entities/rest-job";

/** 休息任务仓储接口 */
export interface RestJobRepository {
  /** 按 ID 查找 */
  findById(id: number): Promise<RestJob | null>;
  /** 查找某住宅当前进行中的休息任务 */
  findInProgressByBuildingId(buildingId: number): Promise<RestJob | null>;
  /** 查找某住宅的所有休息任务 */
  findByBuildingId(buildingId: number): Promise<RestJob[]>;
  /** 保存（新增或更新）休息任务 */
  save(job: RestJob): Promise<RestJob>;
}
