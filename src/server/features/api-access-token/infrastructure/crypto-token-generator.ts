import { randomBytes } from "node:crypto";
import type { TokenGenerator } from "@/server/features/api-access-token/domain/services/token-generator";

const TOKEN_PREFIX = "awt_";
const TOKEN_ENTROPY_BYTES = 32;

export class CryptoTokenGenerator implements TokenGenerator {
  generate(): string {
    const body = randomBytes(TOKEN_ENTROPY_BYTES).toString("base64url");
    return `${TOKEN_PREFIX}${body}`;
  }
}

export const tokenGenerator: TokenGenerator = new CryptoTokenGenerator();
