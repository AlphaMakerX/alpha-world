export interface ApiAccessTokenRepository {
  upsertForUser(input: { userId: string; tokenHash: string }): Promise<void>;

  findUserIdByHash(tokenHash: string): Promise<string | null>;
}
