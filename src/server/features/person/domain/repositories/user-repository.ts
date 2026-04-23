/**
 * 用户仓储接口（领域层）
 *
 * 定义用户聚合根的持久化操作契约，由基础设施层实现。
 */
import type { User } from "@/server/features/person/domain/entities/user";
import type { Username } from "@/server/features/person/domain/value-objects/username";

/** 用户仓储接口 */
export interface UserRepository {
  /** 根据用户 ID 查找用户 */
  findById(id: string): Promise<User | null>;
  /** 根据用户名查找用户 */
  findByUsername(username: Username): Promise<User | null>;
  /** 保存用户（新增或更新） */
  save(user: User): Promise<void>;
}
