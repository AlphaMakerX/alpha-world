import type { Building } from "@/server/features/building/domain/entities/building";

export interface BuildingRepository {
  findById(id: number): Promise<Building | null>;
  findByPlotId(plotId: number): Promise<Building | null>;
  findByPlotIds(plotIds: number[]): Promise<Map<number, Building>>;
  findByOwnerUserId(ownerUserId: string): Promise<Building[]>;
  save(building: Building): Promise<Building>;
}
