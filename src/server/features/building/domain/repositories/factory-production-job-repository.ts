import type { FactoryProductionJob } from "@/server/features/building/domain/entities/factory-production-job";

export interface FactoryProductionJobRepository {
  findById(id: number): Promise<FactoryProductionJob | null>;
  findInProgressByBuildingId(buildingId: number): Promise<FactoryProductionJob | null>;
  findByBuildingId(buildingId: number): Promise<FactoryProductionJob[]>;
  save(job: FactoryProductionJob): Promise<FactoryProductionJob>;
}
