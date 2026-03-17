import { z } from "zod";
import {
  executeInitializeSystemUseCase as executeInitializeSystemUseCaseImpl,
  type InitializeSystemResult,
} from "@/server/features/system-initialization/application/initialize-system-use-case";
import {
  executeSeedPlotsP1UseCase as executeSeedPlotsP1UseCaseImpl,
  type SeedPlotsP1Result,
} from "@/server/features/system-initialization/application/seed-plots-p1-use-case";
import { passwordHasher } from "@/server/features/auth/infrastructure";
import { transactionLedgerRepository, userRepository } from "@/server/features/person/infrastructure";
import { systemInitializationRepository } from "@/server/features/system-initialization/infrastructure";
import { transact } from "@/server/lib/db";

export const seedPlotsP1Schema = z.object({
  totalRows: z.number().int().positive(),
  colsPerRow: z.number().int().positive(),
  minPrice: z.number().positive(),
  maxPrice: z.number().positive(),
});

export async function executeInitializeSystemUseCase(): Promise<InitializeSystemResult> {
  return executeInitializeSystemUseCaseImpl({
    userRepository,
    transactionLedgerRepository,
    passwordHasher,
    systemInitializationRepository,
    transact,
  });
}

export async function executeSeedPlotsP1UseCase(input: unknown): Promise<SeedPlotsP1Result> {
  const parsed = seedPlotsP1Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      code: "BAD_REQUEST",
    };
  }

  return executeSeedPlotsP1UseCaseImpl(parsed.data, {
    systemInitializationRepository,
  });
}
