import { createHash } from "node:crypto";
import type { TokenHasher } from "@/server/features/api-access-token/domain/services/token-hasher";

export class Sha256TokenHasher implements TokenHasher {
  hash(plainText: string): string {
    return createHash("sha256").update(plainText).digest("hex");
  }
}

export const tokenHasher: TokenHasher = new Sha256TokenHasher();
