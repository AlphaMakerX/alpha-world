import { executeInitializeSystemUseCase } from "@/server/features/system-initialization/composition";
import { db } from "@/server/lib/db";

type Step = "adam" | "bot1-manager" | "plot" | "bot1-manager-plot-purchase";
type RequestedStep = "all" | Step;

function parseArgs(): { step?: RequestedStep } {
  const step = process.argv.find((arg) => arg.startsWith("--step="))?.split("=")[1] as
    | RequestedStep
    | undefined;
  if (step && !["all", "adam", "bot1-manager", "plot", "bot1-manager-plot-purchase"].includes(step)) {
    throw new Error("参数 --step 仅支持 all,adam,bot1-manager,plot,bot1-manager-plot-purchase");
  }

  return {
    step,
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
  if (result.summary.executedSteps.includes("bot1-manager-plot-purchase")) {
    console.log(`Bot1 Manager purchased ${result.summary.botPurchasedPlotsCount} plots.`);
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
