import { z } from "zod";
import {
  executeInitializeSystemUseCase as executeInitializeSystemUseCaseImpl,
  type InitializeSystemResult,
} from "@/server/features/system-initialization/application/initialize-system-use-case";
import { passwordHasher } from "@/server/features/auth/infrastructure";
import { systemAccountService, transactionLedgerRepository, userRepository } from "@/server/features/person/infrastructure";
import { systemInitializationRepository } from "@/server/features/system-initialization/infrastructure";
import { plotRepository } from "@/server/features/plot/infrastructure";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { transact } from "@/server/lib/db";

const initializeSystemSchema = z.object({
  step: z
    .enum([
      "all",
      "adam",
      "bot1-manager",
      "plot",
      "bot1-manager-plot-purchase",
      "bot1-manager-purchasing-station-build",
    ])
    .optional(),
});

export async function executeInitializeSystemUseCase(input?: unknown): Promise<InitializeSystemResult> {
  const parsed = initializeSystemSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeInitializeSystemUseCaseImpl(parsed.data, {
    userRepository,
    buildingRepository,
    transactionLedgerRepository,
    passwordHasher,
    systemAccountService,
    plotRepository,
    transact,
    systemInitializationRepository,
  });
}
