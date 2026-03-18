import { randomUUID } from "crypto";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";
import { User } from "@/server/features/person/domain/entities/user";
import { ADAM_USER_ID } from "@/server/features/person/domain/constants/adam";
import {
  BOT1_INITIAL_PASSWORD,
  BOT1_TRANSFER_AMOUNT,
  BOT1_TRANSFER_REFERENCE_ID,
  BOT1_USERNAME,
} from "@/server/features/person/domain/constants/bot";
import type { TransactionLedgerRepository } from "@/server/features/person/domain/repositories/transaction-ledger-repository";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import type { SystemAccountService } from "@/server/features/person/domain/services/system-account-service";
import { Username } from "@/server/features/person/domain/value-objects/username";

type ExecuteBot1StepDeps = {
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

export async function executeBot1Step(input: {
  deps: ExecuteBot1StepDeps;
}): Promise<{ transferSkipped: boolean }> {
  let transferSkipped = false;
  const botPasswordHash = await input.deps.passwordHasher.hash(BOT1_INITIAL_PASSWORD);
  const botUsername = Username.create(BOT1_USERNAME).getValue();

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
    fromUserId: ADAM_USER_ID,
    toUserId: bot.id,
    referenceId: BOT1_TRANSFER_REFERENCE_ID,
  });
  if (transferExists) {
    transferSkipped = true;
    return { transferSkipped };
  }

  const adamSystemAccount = await input.deps.systemAccountService.getSystemAccount();
  const latestBot = bot;

  adamSystemAccount.spendMoney(BOT1_TRANSFER_AMOUNT);
  latestBot.receiveMoney(BOT1_TRANSFER_AMOUNT);
  await input.deps.userRepository.save(adamSystemAccount);
  await input.deps.userRepository.save(latestBot);

  await input.deps.transactionLedgerRepository.record({
    fromUserId: adamSystemAccount.id,
    toUserId: latestBot.id,
    amount: BOT1_TRANSFER_AMOUNT,
    type: "system_init_transfer",
    referenceId: BOT1_TRANSFER_REFERENCE_ID,
    description: `系统初始化转账 -> ${latestBot.username.getValue()}`,
  });

  return { transferSkipped };
}
