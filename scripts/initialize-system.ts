import { executeInitializeSystemUseCase } from "@/server/features/system-initialization/composition";
import { db } from "@/server/lib/db";

type Step = "adam" | "bot1-manager" | "plot";
type RequestedStep = "all" | Step;

function parseNumberArg(name: string): number | undefined {
  const raw = process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];
  if (!raw) {
    return undefined;
  }
  const num = Number(raw);
  if (Number.isNaN(num)) {
    throw new Error(`参数 --${name} 必须是数字`);
  }
  return num;
}

function parseArgs(): {
  step?: RequestedStep;
  plotConfig?: {
    totalRows?: number;
    colsPerRow?: number;
    minPrice?: number;
    maxPrice?: number;
  };
} {
  const step = process.argv.find((arg) => arg.startsWith("--step="))?.split("=")[1] as
    | RequestedStep
    | undefined;
  if (step && !["all", "adam", "bot1-manager", "plot"].includes(step)) {
    throw new Error("参数 --step 仅支持 all,adam,bot1-manager,plot");
  }

  const totalRows = parseNumberArg("totalRows");
  const colsPerRow = parseNumberArg("colsPerRow");
  const minPrice = parseNumberArg("minPrice");
  const maxPrice = parseNumberArg("maxPrice");

  const hasPlotConfig = [totalRows, colsPerRow, minPrice, maxPrice].some(
    (value) => value !== undefined,
  );

  return {
    step,
    plotConfig: hasPlotConfig
      ? {
          totalRows,
          colsPerRow,
          minPrice,
          maxPrice,
        }
      : undefined,
  };
}

async function initializeSystem() {
  const result = await executeInitializeSystemUseCase(parseArgs());

  if (!result.ok) {
    throw new Error(result.error);
  }

  console.log(`Executed steps: ${result.summary.executedSteps.join(", ")}`);
  if (result.summary.executedSteps.includes("adam")) {
    console.log(`Adam initialized: "${result.summary.adamUsername}".`);
  }
  if (result.summary.executedSteps.includes("bot1-manager")) {
    console.log(`Bot1 Manager initialized: "${result.summary.botUsername}".`);
  }
  if (
    result.summary.executedSteps.includes("bot1-manager") &&
    result.summary.transferSkipped
  ) {
    console.log("Initial manager budget transfer already exists, skipping.");
  } else if (result.summary.executedSteps.includes("bot1-manager")) {
    console.log(
      `Transferred ${result.summary.transferredAmount.toLocaleString()} budget to "${result.summary.botUsername}".`,
    );
  }
  if (result.summary.executedSteps.includes("plot") && result.summary.plotRange) {
    console.log(
      `Seeded plots ${result.summary.plotRange.from} ~ ${result.summary.plotRange.to} (${result.summary.plotsSeededCount} plots).`,
    );
  }
}

initializeSystem()
  .catch((error) => {
    console.error("Failed to initialize system:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
