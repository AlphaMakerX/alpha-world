import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

export type SeedPlotsP1Command = {
  totalRows: number;
  colsPerRow: number;
  minPrice: number;
  maxPrice: number;
};

type SeedPlotsP1SuccessResult = {
  ok: true;
  seededCount: number;
  range: {
    from: string;
    to: string;
  };
};

type SeedPlotsP1FailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type SeedPlotsP1Result = SeedPlotsP1SuccessResult | SeedPlotsP1FailureResult;

export type SeedPlotsP1UseCaseDeps = {
  systemInitializationRepository: {
    upsertPlotsPriceIfUnowned(input: {
      totalRows: number;
      colsPerRow: number;
      minPrice: number;
      maxPrice: number;
    }): Promise<void>;
  };
};

function formatPlotId(row: number, col: number): string {
  return `P${row}-${String(col).padStart(2, "0")}`;
}

export async function executeSeedPlotsP1UseCase(
  command: SeedPlotsP1Command,
  deps: SeedPlotsP1UseCaseDeps,
): Promise<SeedPlotsP1Result> {
  if (command.totalRows <= 0 || command.colsPerRow <= 0) {
    return {
      ok: false,
      error: "行列数量必须大于 0",
      code: "BAD_REQUEST",
    };
  }
  if (command.minPrice <= 0 || command.maxPrice <= 0 || command.minPrice > command.maxPrice) {
    return {
      ok: false,
      error: "价格区间不合法",
      code: "BAD_REQUEST",
    };
  }

  await deps.systemInitializationRepository.upsertPlotsPriceIfUnowned({
    totalRows: command.totalRows,
    colsPerRow: command.colsPerRow,
    minPrice: command.minPrice,
    maxPrice: command.maxPrice,
  });

  return {
    ok: true,
    seededCount: command.totalRows * command.colsPerRow,
    range: {
      from: formatPlotId(1, 1),
      to: formatPlotId(command.totalRows, command.colsPerRow),
    },
  };
}
