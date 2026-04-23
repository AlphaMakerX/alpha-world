/**
 * 基于 bcrypt 的密码哈希服务实现
 *
 * 实现领域层 PasswordHasher 接口，使用 bcryptjs 库进行密码哈希和校验。
 */

import { compare, hash } from "bcryptjs";
import type { PasswordHasher } from "@/server/features/auth/domain/services/password-hasher";

/** bcrypt 加盐轮数，值越大越安全但也越慢 */
const BCRYPT_SALT_ROUNDS = 10;

/** 使用 bcrypt 算法的 PasswordHasher 实现 */
export class BcryptPasswordHasher implements PasswordHasher {
  hash(plainText: string): Promise<string> {
    return hash(plainText, BCRYPT_SALT_ROUNDS);
  }

  verify(plainText: string, passwordHash: string): Promise<boolean> {
    return compare(plainText, passwordHash);
  }
}

/** 导出单例供依赖注入使用 */
export const passwordHasher: PasswordHasher = new BcryptPasswordHasher();
