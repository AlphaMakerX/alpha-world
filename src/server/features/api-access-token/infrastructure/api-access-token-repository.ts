import { eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import type { ApiAccessTokenRepository } from "@/server/features/api-access-token/domain/repositories/api-access-token-repository";
import { userApiTokens } from "@/server/features/api-access-token/infrastructure/schema";

export class DrizzleApiAccessTokenRepository implements ApiAccessTokenRepository {
  async upsertForUser(input: { userId: string; tokenHash: string }): Promise<void> {
    const now = new Date();
    await getDbClient()
      .insert(userApiTokens)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userApiTokens.userId,
        set: {
          tokenHash: input.tokenHash,
          updatedAt: now,
        },
      });
  }

  async findUserIdByHash(tokenHash: string): Promise<string | null> {
    const record = await getDbClient().query.userApiTokens.findFirst({
      where: eq(userApiTokens.tokenHash, tokenHash),
    });

    return record?.userId ?? null;
  }
}

export const apiAccessTokenRepository: ApiAccessTokenRepository =
  new DrizzleApiAccessTokenRepository();
