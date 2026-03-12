import { eq } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { User } from "@/server/features/person/domain/entities/user";
import type { UserRepository } from "@/server/features/person/domain/repositories/user-repository";
import { Username } from "@/server/features/person/domain/value-objects/username";
import { users } from "@/server/features/person/infrastructure/schema";

function toDomainUser(record: typeof users.$inferSelect) {
  return User.rehydrate({
    id: record.id,
    username: Username.create(record.username),
    passwordHash: record.passwordHash,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export class DrizzleUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const record = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!record) {
      return null;
    }

    return toDomainUser(record);
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalizedUsername = Username.create(username).getValue();
    const record = await db.query.users.findFirst({
      where: eq(users.username, normalizedUsername),
    });

    if (!record) {
      return null;
    }

    return toDomainUser(record);
  }

  async save(user: User): Promise<void> {
    await db
      .insert(users)
      .values({
        id: user.id,
        username: user.username.getValue(),
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: user.username.getValue(),
          passwordHash: user.passwordHash,
          updatedAt: new Date(),
        },
      });
  }
}

export const userRepository: UserRepository = new DrizzleUserRepository();
