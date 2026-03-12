import type { Plot } from "@/server/features/plot/domain/entities/plot";
import type { PlotCoordinate } from "@/server/features/plot/domain/value-objects/plot-coordinate";

export interface PlotRepository {
  findById(id: number): Promise<Plot | null>;
  findByCoordinate(coordinate: PlotCoordinate): Promise<Plot | null>;
  save(plot: Plot): Promise<void>;
}
