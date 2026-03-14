import { db } from "@/server/lib/db";
import { moneyTransactions, users } from "@/server/features/person/infrastructure/schema";
import { ADAM_USER_ID, ADAM_USERNAME, ADAM_INITIAL_MONEY, ADAM_INITIAL_PASSWORD } from "@/server/features/shared-kernel/domain/adam";
import { hash } from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";

const BOT1_USERNAME = "bot1";
const BOT1_PASSWORD = "bot123456";
const BOT1_TRANSFER_AMOUNT = 10_000_000;
const BOT1_TRANSFER_REFERENCE_ID = "system_init_bot1_transfer_v1";

async function initializeSystem() {
  const [adamPasswordHash, bot1PasswordHash] = await Promise.all([
    hash(ADAM_INITIAL_PASSWORD, 10),
    hash(BOT1_PASSWORD, 10),
  ]);

  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({
        id: ADAM_USER_ID,
        username: ADAM_USERNAME,
        passwordHash: adamPasswordHash,
        money: ADAM_INITIAL_MONEY.toFixed(2),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: ADAM_USERNAME,
          passwordHash: adamPasswordHash,
          money: ADAM_INITIAL_MONEY.toFixed(2),
        },
      });

    const [bot1] = await tx
      .insert(users)
      .values({
        username: BOT1_USERNAME,
        passwordHash: bot1PasswordHash,
        money: "0.00",
      })
      .onConflictDoUpdate({
        target: users.username,
        set: {
          passwordHash: bot1PasswordHash,
        },
      })
      .returning({
        id: users.id,
      });

    const [existingTransfer] = await tx
      .select({ id: moneyTransactions.id })
      .from(moneyTransactions)
      .where(
        and(
          eq(moneyTransactions.fromUserId, ADAM_USER_ID),
          eq(moneyTransactions.toUserId, bot1.id),
          eq(moneyTransactions.type, "system_init_transfer"),
          eq(moneyTransactions.referenceId, BOT1_TRANSFER_REFERENCE_ID),
        ),
      )
      .limit(1);

    if (!existingTransfer) {
      const amount = BOT1_TRANSFER_AMOUNT.toFixed(2);

      await tx
        .update(users)
        .set({
          money: sql`${users.money} - ${amount}`,
        })
        .where(eq(users.id, ADAM_USER_ID));

      await tx
        .update(users)
        .set({
          money: sql`${users.money} + ${amount}`,
        })
        .where(eq(users.id, bot1.id));

      await tx.insert(moneyTransactions).values({
        fromUserId: ADAM_USER_ID,
        toUserId: bot1.id,
        amount,
        type: "system_init_transfer",
        referenceId: BOT1_TRANSFER_REFERENCE_ID,
        description: `系统初始化转账 -> ${BOT1_USERNAME}`,
      });
    }
  });

  console.log(`System users initialized: "${ADAM_USERNAME}" and "${BOT1_USERNAME}".`);
  console.log(`Transfer ensured: ${ADAM_USERNAME} -> ${BOT1_USERNAME}, amount: ${BOT1_TRANSFER_AMOUNT.toLocaleString()}.`);
}

initializeSystem()
  .catch((error) => {
    console.error("Failed to initialize system:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
