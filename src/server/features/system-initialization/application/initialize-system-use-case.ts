import { randomUUID } from "crypto";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { User } from "@/server/features/person/domain/entities/user";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { Username } from "@/server/features/person/domain/value-objects/username";
import { ADAM_INITIAL_MONEY, ADAM_INITIAL_PASSWORD, ADAM_USER_ID, ADAM_USERNAME } from "@/server/features/shared-kernel/domain/adam";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

const DEFAULT_BOT_USERNAME = "bot1";
const DEFAULT_BOT_PASSWORD = "bot123456";
const DEFAULT_BOT_TRANSFER_AMOUNT = 10_000_000;
const DEFAULT_BOT_TRANSFER_REFERENCE_ID = "system_init_bot1_transfer_v1";

type InitializeSystemSuccessResult = {
  ok: true;
  summary: {
    adamUsername: string;
    botUsername: string;
    transferredAmount: number;
    transferSkipped: boolean;
  };
};

type InitializeSystemFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type InitializeSystemResult = InitializeSystemSuccessResult | InitializeSystemFailureResult;

export type InitializeSystemUseCaseDeps = {
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  passwordHasher: PasswordHasher;
  systemInitializationRepository: {
    hasMoneyTransfer(input: {
      fromUserId: string;
      toUserId: string;
      referenceId: string;
    }): Promise<boolean>;
  };
  transact: <T>(fn: () => Promise<T>) => Promise<T>;
};

export async function executeInitializeSystemUseCase(
  deps: InitializeSystemUseCaseDeps,
): Promise<InitializeSystemResult> {
  if (DEFAULT_BOT_TRANSFER_AMOUNT <= 0) {
    return {
      ok: false,
      error: "转账金额必须大于 0",
      code: "BAD_REQUEST",
    };
  }

  const botUsername = Username.create(DEFAULT_BOT_USERNAME).getValue();
  const adamPasswordHash = await deps.passwordHasher.hash(ADAM_INITIAL_PASSWORD);
  const botPasswordHash = await deps.passwordHasher.hash(DEFAULT_BOT_PASSWORD);
  let transferSkipped = false;

  await deps.transact(async () => {
    const adam = User.register({
      id: ADAM_USER_ID,
      username: ADAM_USERNAME,
      passwordHash: adamPasswordHash,
      initialMoney: ADAM_INITIAL_MONEY,
    });
    await deps.userRepository.save(adam);

    let bot = await deps.userRepository.findByUsername(Username.create(botUsername));
    if (!bot) {
      bot = User.register({
        id: randomUUID(),
        username: botUsername,
        passwordHash: botPasswordHash,
        initialMoney: 0,
      });
    } else {
      bot.changePasswordHash(botPasswordHash);
    }
    await deps.userRepository.save(bot);

    const transferExists = await deps.systemInitializationRepository.hasMoneyTransfer({
      fromUserId: ADAM_USER_ID,
      toUserId: bot.id,
      referenceId: DEFAULT_BOT_TRANSFER_REFERENCE_ID,
    });
    if (transferExists) {
      transferSkipped = true;
      return;
    }

    const latestAdam = await deps.userRepository.findById(ADAM_USER_ID);
    const latestBot = await deps.userRepository.findById(bot.id);
    if (!latestAdam || !latestBot) {
      throw new Error("系统初始化失败：用户状态异常");
    }

    latestAdam.spendMoney(DEFAULT_BOT_TRANSFER_AMOUNT);
    latestBot.receiveMoney(DEFAULT_BOT_TRANSFER_AMOUNT);
    await deps.userRepository.save(latestAdam);
    await deps.userRepository.save(latestBot);

    await deps.transactionLedgerRepository.record({
      fromUserId: latestAdam.id,
      toUserId: latestBot.id,
      amount: DEFAULT_BOT_TRANSFER_AMOUNT,
      type: "system_init_transfer",
      referenceId: DEFAULT_BOT_TRANSFER_REFERENCE_ID,
      description: `系统初始化转账 -> ${latestBot.username.getValue()}`,
    });
  });

  const bot = await deps.userRepository.findByUsername(Username.create(botUsername));
  if (!bot) {
    return {
      ok: false,
      error: "系统初始化失败：未找到 bot 账户",
      code: "NOT_FOUND",
    };
  }

  return {
    ok: true,
    summary: {
      adamUsername: ADAM_USERNAME,
      botUsername,
      transferredAmount: DEFAULT_BOT_TRANSFER_AMOUNT,
      transferSkipped,
    },
  };
}
