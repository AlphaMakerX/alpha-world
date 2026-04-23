/**
 * 地块初始化步骤
 *
 * 按照行列网格布局生成地块，为每个地块随机分配一个价格区间内的价格。
 * 已被购买的地块不会被覆盖（仅更新无主地块的价格）。
 */

import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

/** 默认地图总行数 */
const DEFAULT_PLOT_TOTAL_ROWS = 6;
/** 默认每行地块列数 */
const DEFAULT_PLOT_COLS_PER_ROW = 50;
/** 默认地块最低价格 */
const DEFAULT_PLOT_MIN_PRICE = 1000;
/** 默认地块最高价格 */
const DEFAULT_PLOT_MAX_PRICE = 3000;

/** 地块生成配置（均可选，有默认值） */
type PlotConfig = {
  totalRows?: number;
  colsPerRow?: number;
  minPrice?: number;
  maxPrice?: number;
};

/** 步骤所需的外部依赖 */
type ExecutePlotStepDeps = {
  systemInitializationRepository: {
    upsertPlotsPriceIfUnowned(input: {
      totalRows: number;
      colsPerRow: number;
      minPrice: number;
      maxPrice: number;
    }): Promise<void>;
  };
};

type PlotStepSuccessResult = {
  plotsSeededCount: number;
  plotRange: {
    from: string;
    to: string;
  } | null;
};

type PlotStepFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type ExecutePlotStepResult = PlotStepSuccessResult | PlotStepFailureResult;

/** 格式化地块坐标为可读的 ID 字符串（如 "P1-01"） */
function formatPlotId(row: number, col: number): string {
  return `P${row}-${String(col).padStart(2, "0")}`;
}

/**
 * 执行地块初始化步骤
 *
 * 根据配置生成网格地块，使用 upsert 策略确保只更新无主地块的价格。
 */
export async function executePlotStep(input: {
  deps: ExecutePlotStepDeps;
  plotConfig?: PlotConfig;
}): Promise<ExecutePlotStepResult> {
  const totalRows = input.plotConfig?.totalRows ?? DEFAULT_PLOT_TOTAL_ROWS;
  const colsPerRow = input.plotConfig?.colsPerRow ?? DEFAULT_PLOT_COLS_PER_ROW;
  const minPrice = input.plotConfig?.minPrice ?? DEFAULT_PLOT_MIN_PRICE;
  const maxPrice = input.plotConfig?.maxPrice ?? DEFAULT_PLOT_MAX_PRICE;

  if (totalRows <= 0 || colsPerRow <= 0) {
    return {
      ok: false,
      error: "地图行列数量必须大于 0",
      code: "BAD_REQUEST",
    };
  }

  if (minPrice <= 0 || maxPrice <= 0 || minPrice > maxPrice) {
    return {
      ok: false,
      error: "地图价格区间不合法",
      code: "BAD_REQUEST",
    };
  }

  await input.deps.systemInitializationRepository.upsertPlotsPriceIfUnowned({
    totalRows,
    colsPerRow,
    minPrice,
    maxPrice,
  });

  return {
    plotsSeededCount: totalRows * colsPerRow,
    plotRange: {
      from: formatPlotId(1, 1),
      to: formatPlotId(totalRows, colsPerRow),
    },
  };
}
