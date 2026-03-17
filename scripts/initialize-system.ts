import { db } from "@/server/lib/db";
import { moneyTransactions, users } from "@/server/features/person/infrastructure/schema";
import { ADAM_USER_ID, ADAM_USERNAME, ADAM_INITIAL_MONEY, ADAM_INITIAL_PASSWORD } from "@/server/features/shared-kernel/domain/adam";
import { hash } from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";

const BOT1_USERNAME = "bot1";
const BOT1_PASSWORD = "bot123456";
const BOT1_TRANSFER_AMOUNT = 10_000_000;
const BOT1_TRANSFER_REFERENCE_ID = "system_init_bot1_transfer_v1";

async function createAdam() {
  const passwordHash = await hash(ADAM_INITIAL_PASSWORD, 10);

  await db
    .insert(users)
    .values({
      id: ADAM_USER_ID,
      username: ADAM_USERNAME,
      passwordHash,
      money: ADAM_INITIAL_MONEY.toFixed(2),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        username: ADAM_USERNAME,
        passwordHash,
        money: ADAM_INITIAL_MONEY.toFixed(2),
      },
    });

  console.log(`Adam created: "${ADAM_USERNAME}".`);
}

async function createBot() {
  const passwordHash = await hash(BOT1_PASSWORD, 10);

  await db
    .insert(users)
    .values({
      username: BOT1_USERNAME,
      passwordHash,
      money: "0.00",
    })
    .onConflictDoUpdate({
      target: users.username,
      set: { passwordHash },
    });

  console.log(`Bot created: "${BOT1_USERNAME}".`);
}

async function transferMoneyToUserByUsername(
  username: string,
  amount: number,
  referenceId: string,
) {
  await db.transaction(async (tx) => {
    const [recipient] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!recipient) {
      throw new Error(`User "${username}" not found.`);
    }

    const [existingTransfer] = await tx
      .select({ id: moneyTransactions.id })
      .from(moneyTransactions)
      .where(
        and(
          eq(moneyTransactions.fromUserId, ADAM_USER_ID),
          eq(moneyTransactions.toUserId, recipient.id),
          eq(moneyTransactions.referenceId, referenceId),
        ),
      )
      .limit(1);

    if (existingTransfer) {
      console.log(`Transfer "${referenceId}" already exists, skipping.`);
      return;
    }

    const amountStr = amount.toFixed(2);

    await tx
      .update(users)
      .set({ money: sql`${users.money} - ${amountStr}` })
      .where(eq(users.id, ADAM_USER_ID));

    await tx
      .update(users)
      .set({ money: sql`${users.money} + ${amountStr}` })
      .where(eq(users.id, recipient.id));

    await tx.insert(moneyTransactions).values({
      fromUserId: ADAM_USER_ID,
      toUserId: recipient.id,
      amount: amountStr,
      type: "system_init_transfer",
      referenceId,
      description: `系统初始化转账 -> ${username}`,
    });

    console.log(`Transferred ${amount.toLocaleString()} to "${username}".`);
  });
}


async function initializeSystem() {
  await createAdam();
  await createBot();
  await transferMoneyToUserByUsername(BOT1_USERNAME, BOT1_TRANSFER_AMOUNT, BOT1_TRANSFER_REFERENCE_ID);
  // await transferMoneyToUserByUsername('ccc', BOT1_TRANSFER_AMOUNT, BOT1_TRANSFER_REFERENCE_ID);

}

initializeSystem()
  .catch((error) => {
    console.error("Failed to initialize system:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
