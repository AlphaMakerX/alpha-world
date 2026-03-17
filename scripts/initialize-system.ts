import { executeInitializeSystemUseCase } from "@/server/features/system-initialization/composition";
import { db } from "@/server/lib/db";

async function initializeSystem() {
  const result = await executeInitializeSystemUseCase();

  if (!result.ok) {
    throw new Error(result.error);
  }

  console.log(`Adam initialized: "${result.summary.adamUsername}".`);
  console.log(`Bot initialized: "${result.summary.botUsername}".`);
  if (result.summary.transferSkipped) {
    console.log("Initial bot transfer already exists, skipping.");
  } else {
    console.log(
      `Transferred ${result.summary.transferredAmount.toLocaleString()} to "${result.summary.botUsername}".`,
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
