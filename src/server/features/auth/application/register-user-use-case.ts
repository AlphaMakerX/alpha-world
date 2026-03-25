import { randomUUID } from "crypto";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { User } from "@/server/features/person/domain/entities/user";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import { Username } from "@/server/features/person/domain/value-objects/username";
import { ADAM_PERSONA_CONFIG } from "@/server/features/person/domain/personas";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

export type RegisterUserCommand = {
  username: string;
  password: string;
};

type RegisterUserSuccessResult = {
  ok: true;
  user: {
    id: string;
    username: string;
  };
};

type RegisterUserFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type RegisterUserResult = RegisterUserSuccessResult | RegisterUserFailureResult;

export type RegisterUserUseCaseDeps = {
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  systemAccountService: SystemAccountService;
  passwordHasher: PasswordHasher;
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executeRegisterUserUseCase(
  command: RegisterUserCommand,
  deps: RegisterUserUseCaseDeps,
): Promise<RegisterUserResult> {
  if (command.username.trim().toLowerCase() === ADAM_PERSONA_CONFIG.username) {
    return {
      ok: false,
      error: "该用户名为系统保留名称",
      code: "CONFLICT",
    };
  }

  const username = Username.create(command.username);
  const existingUser = await deps.userRepository.findByUsername(username);
  if (existingUser) {
    return {
      ok: false,
      error: "用户名已存在",
      code: "CONFLICT",
    };
  }

  const adam = await deps.systemAccountService.getSystemAccount();

  const initialMoney = 10000;
  const passwordHash = await deps.passwordHasher.hash(command.password);
  const user = User.register({
    id: randomUUID(),
    username: username.getValue(),
    passwordHash,
    initialMoney,
  });

  await deps.transact(async () => {
    adam.spendMoney(initialMoney);
    await deps.userRepository.save(adam);
    await deps.userRepository.save(user);
    await deps.transactionLedgerRepository.record({
      fromUserId: adam.id,
      toUserId: user.id,
      amount: initialMoney,
      type: "registration_grant",
      description: `注册赠金 → ${user.username.getValue()}`,
    });
  });

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username.getValue(),
    },
  };
}
