import { User } from "@/server/features/person/domain/entities/user";
import { ADAM_INITIAL_MONEY, ADAM_INITIAL_PASSWORD, ADAM_USER_ID, ADAM_USERNAME } from "@/server/features/person/domain/constants/adam";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";

type ExecuteAdamStepDeps = {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
};

export async function executeAdamStep(input: { deps: ExecuteAdamStepDeps }): Promise<void> {
  const adamPasswordHash = await input.deps.passwordHasher.hash(ADAM_INITIAL_PASSWORD);

  const adam = User.register({
    id: ADAM_USER_ID,
    username: ADAM_USERNAME,
    passwordHash: adamPasswordHash,
    initialMoney: ADAM_INITIAL_MONEY,
  });

  await input.deps.userRepository.save(adam);
}
