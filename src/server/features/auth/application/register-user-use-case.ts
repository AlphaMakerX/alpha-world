import { randomUUID } from "crypto";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { User } from "@/server/features/person/domain/entities/user";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import { Username } from "@/server/features/person/domain/value-objects/username";
import { ADAM_USER_ID, ADAM_USERNAME } from "@/server/features/shared-kernel/domain/adam";

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
  status: 400 | 409;
};

export type RegisterUserResult = RegisterUserSuccessResult | RegisterUserFailureResult;

export type RegisterUserUseCaseDeps = {
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  passwordHasher: PasswordHasher;
};

export async function executeRegisterUserUseCase(
  command: RegisterUserCommand,
  deps: RegisterUserUseCaseDeps,
): Promise<RegisterUserResult> {
  if (command.username.trim().toLowerCase() === ADAM_USERNAME) {
    return {
      ok: false,
      error: "该用户名为系统保留名称",
      status: 409,
    };
  }

  const username = Username.create(command.username);
  const existingUser = await deps.userRepository.findByUsername(username);
  if (existingUser) {
    return {
      ok: false,
      error: "用户名已存在",
      status: 409,
    };
  }

  const adam = await deps.userRepository.findById(ADAM_USER_ID);
  if (!adam) {
    return {
      ok: false,
      error: "系统尚未初始化，请先运行 init:system",
      status: 400,
    };
  }

  const initialMoney = 10000;
  const passwordHash = await deps.passwordHasher.hash(command.password);
  const user = User.register({
    id: randomUUID(),
    username: username.getValue(),
    passwordHash,
    initialMoney,
  });

  adam.spendMoney(initialMoney);
  await deps.userRepository.save(adam);
  await deps.userRepository.save(user);
  await deps.transactionLedgerRepository.record({
    fromUserId: ADAM_USER_ID,
    toUserId: user.id,
    amount: initialMoney,
    type: "registration_grant",
    description: `注册赠金 → ${user.username.getValue()}`,
  });

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username.getValue(),
    },
  };
}
