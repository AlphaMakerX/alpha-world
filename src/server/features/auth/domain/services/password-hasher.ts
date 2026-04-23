/**
 * 密码哈希服务接口（领域层端口）
 *
 * 定义密码加密与校验的抽象契约，由基础设施层提供具体实现（如 bcrypt）。
 */

export interface PasswordHasher {
  /** 将明文密码加密为哈希值 */
  hash(plainText: string): Promise<string>;
  /** 校验明文密码是否与已存储的哈希值匹配 */
  verify(plainText: string, passwordHash: string): Promise<boolean>;
}
