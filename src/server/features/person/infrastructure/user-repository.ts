/**
 * 用户仓储的 Drizzle ORM 实现
 *
 * 提供用户实体的持久化操作，包括按 ID/用户名查询和 upsert 保存。
 */
import { eq } from "drizzle-orm";
import { getDbClient } from "@/server/lib/db";
import { User } from "@/server/features/person/domain/entities/user";
import type { UserRole } from "@/server/features/person/domain/entities/user";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { Username } from "@/server/features/person/domain/value-objects/username";
import { users } from "@/server/features/person/infrastructure/schema";

/** 将数据库记录转换为领域实体 User */
function toDomainUser(record: typeof users.$inferSelect) {
  return User.rehydrate({
    id: record.id,
    username: Username.create(record.username),
    passwordHash: record.passwordHash,
    role: record.role as UserRole,
    money: Number(record.money),
    positionX: Number(record.positionX),
    positionY: Number(record.positionY),
    staminaCurrent: Number(record.staminaCurrent),
    staminaMax: Number(record.staminaMax),
    staminaUpdatedAt: record.staminaUpdatedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

/** 基于 Drizzle ORM 的用户仓储实现 */
export class DrizzleUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const record = await getDbClient().query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!record) {
      return null;
    }

    return toDomainUser(record);
  }

  async findByUsername(username: Username): Promise<User | null> {
    const normalizedUsername = username.getValue();
    const record = await getDbClient().query.users.findFirst({
      where: eq(users.username, normalizedUsername),
    });

    if (!record) {
      return null;
    }

    return toDomainUser(record);
  }

  /** 保存用户（insert or update），使用 onConflictDoUpdate 实现 upsert */
  async save(user: User): Promise<void> {
    await getDbClient()
      .insert(users)
      .values({
        id: user.id,
        username: user.username.getValue(),
        passwordHash: user.passwordHash,
        role: user.role,
        money: user.money.toString(),
        positionX: user.positionX.toString(),
        positionY: user.positionY.toString(),
        staminaCurrent: user.staminaCurrent.toString(),
        staminaMax: user.staminaMax.toString(),
        staminaUpdatedAt: user.staminaUpdatedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: user.username.getValue(),
          passwordHash: user.passwordHash,
          role: user.role,
          money: user.money.toString(),
          positionX: user.positionX.toString(),
          positionY: user.positionY.toString(),
          staminaCurrent: user.staminaCurrent.toString(),
          staminaMax: user.staminaMax.toString(),
          staminaUpdatedAt: user.staminaUpdatedAt,
          updatedAt: new Date(),
        },
      });
  }
}

export const userRepository: UserRepository = new DrizzleUserRepository();
