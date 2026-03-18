import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

const DEFAULT_PLOT_TOTAL_ROWS = 6;
const DEFAULT_PLOT_COLS_PER_ROW = 50;
const DEFAULT_PLOT_MIN_PRICE = 1000;
const DEFAULT_PLOT_MAX_PRICE = 3000;

type PlotConfig = {
  totalRows?: number;
  colsPerRow?: number;
  minPrice?: number;
  maxPrice?: number;
};

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

function formatPlotId(row: number, col: number): string {
  return `P${row}-${String(col).padStart(2, "0")}`;
}

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
