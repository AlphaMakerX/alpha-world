import { User } from "@/server/features/person/domain/entities/user";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

type ExecuteAdamStepDeps = {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
};

type AdamStepFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type ExecuteAdamStepResult = { ok: true } | AdamStepFailureResult;

export async function executeAdamStep(input: { deps: ExecuteAdamStepDeps }): Promise<ExecuteAdamStepResult> {
  if (!ADAM_PERSONA_CONFIG.initialPassword || ADAM_PERSONA_CONFIG.initialPassword.trim().length === 0) {
    return {
      ok: false,
      error: "ADAM_INITIAL_PASSWORD is not set. Please configure it in your environment.",
      code: "BAD_REQUEST",
    };
  }
  const adamPasswordHash = await input.deps.passwordHasher.hash(ADAM_PERSONA_CONFIG.initialPassword);

  const adam = User.register({
    id: ADAM_PERSONA_CONFIG.userId,
    username: ADAM_PERSONA_CONFIG.username,
    passwordHash: adamPasswordHash,
    initialMoney: ADAM_PERSONA_CONFIG.initialMoney,
  });

  await input.deps.userRepository.save(adam);
  return { ok: true };
}
