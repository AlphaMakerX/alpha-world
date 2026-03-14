import { db } from "@/server/lib/db";
import { users } from "@/server/features/person/infrastructure/schema";
import { ADAM_USER_ID, ADAM_USERNAME, ADAM_INITIAL_MONEY, ADAM_INITIAL_PASSWORD } from "@/server/features/shared-kernel/domain/adam";
import { hash } from "bcryptjs";

async function initializeSystem() {
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

  console.log(
    `System player "${ADAM_USERNAME}" initialized (id: ${ADAM_USER_ID}, money: ${ADAM_INITIAL_MONEY.toLocaleString()}).`,
  );
}

initializeSystem()
  .catch((error) => {
    console.error("Failed to initialize system:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
