import { randomUUID } from "crypto";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { User } from "@/server/features/person/domain/entities/user";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import { Username } from "@/server/features/person/domain/value-objects/username";
import {
  ADAM_PERSONA_CONFIG,
  BOT1_MANAGER_PERSONA_CONFIG,
} from "@/server/features/person/domain/personas";
import type { UseCaseErrorCode } from "@/server/features/shared-kernel/domain/use-case-result";

type ExecuteBot1ManagerStepDeps = {
  userRepository: UserRepository;
  transactionLedgerRepository: TransactionLedgerRepository;
  passwordHasher: PasswordHasher;
  systemAccountService: SystemAccountService;
  systemInitializationRepository: {
    hasMoneyTransfer(input: {
      fromUserId: string;
      toUserId: string;
      referenceId: string;
    }): Promise<boolean>;
  };
};

type Bot1ManagerStepSuccessResult = {
  transferSkipped: boolean;
};

type Bot1ManagerStepFailureResult = {
  ok: false;
  error: string;
  code: UseCaseErrorCode;
};

export type ExecuteBot1ManagerStepResult =
  | Bot1ManagerStepSuccessResult
  | Bot1ManagerStepFailureResult;

function getBot1ManagerInitialPasswordFromEnv():
  | { ok: true; value: string }
  | { ok: false; error: string; code: UseCaseErrorCode } {
  const envKey = BOT1_MANAGER_PERSONA_CONFIG.initialPasswordEnvKey;
  const value = process.env[envKey];
  if (!value || value.trim().length === 0) {
    return {
      ok: false,
      error: `${envKey} is not set. Please configure it in your environment.`,
      code: "BAD_REQUEST",
    };
  }
  return { ok: true, value };
}

export async function executeBot1ManagerStep(input: {
  deps: ExecuteBot1ManagerStepDeps;
}): Promise<ExecuteBot1ManagerStepResult> {
  if (BOT1_MANAGER_PERSONA_CONFIG.transferAmount <= 0) {
    return {
      ok: false,
      error: "转账金额必须大于 0",
      code: "BAD_REQUEST",
    };
  }

  const initialPasswordResult = getBot1ManagerInitialPasswordFromEnv();
  if (!initialPasswordResult.ok) {
    return initialPasswordResult;
  }

  let transferSkipped = false;
  const botPasswordHash = await input.deps.passwordHasher.hash(initialPasswordResult.value);
  const botUsername = Username.create(BOT1_MANAGER_PERSONA_CONFIG.username).getValue();

  let bot = await input.deps.userRepository.findByUsername(Username.create(botUsername));
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
  await input.deps.userRepository.save(bot);

  const transferExists = await input.deps.systemInitializationRepository.hasMoneyTransfer({
    fromUserId: ADAM_PERSONA_CONFIG.userId,
    toUserId: bot.id,
    referenceId: BOT1_MANAGER_PERSONA_CONFIG.transferReferenceId,
  });
  if (transferExists) {
    transferSkipped = true;
    return { transferSkipped };
  }

  const adamSystemAccount = await input.deps.systemAccountService.getSystemAccount();
  const latestBot = bot;

  adamSystemAccount.spendMoney(BOT1_MANAGER_PERSONA_CONFIG.transferAmount);
  latestBot.receiveMoney(BOT1_MANAGER_PERSONA_CONFIG.transferAmount);
  await input.deps.userRepository.save(adamSystemAccount);
  await input.deps.userRepository.save(latestBot);

  await input.deps.transactionLedgerRepository.record({
    fromUserId: adamSystemAccount.id,
    toUserId: latestBot.id,
    amount: BOT1_MANAGER_PERSONA_CONFIG.transferAmount,
    type: "system_init_transfer",
    referenceId: BOT1_MANAGER_PERSONA_CONFIG.transferReferenceId,
    description: `系统初始化预算拨付 -> ${latestBot.username.getValue()}`,
  });

  return { transferSkipped };
}
