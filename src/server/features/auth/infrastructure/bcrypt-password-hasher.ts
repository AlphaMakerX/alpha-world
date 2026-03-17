import { compare, hash } from "bcryptjs";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";

const BCRYPT_SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(plainText: string): Promise<string> {
    return hash(plainText, BCRYPT_SALT_ROUNDS);
  }

  verify(plainText: string, passwordHash: string): Promise<boolean> {
    return compare(plainText, passwordHash);
  }
}

export const passwordHasher: PasswordHasher = new BcryptPasswordHasher();
