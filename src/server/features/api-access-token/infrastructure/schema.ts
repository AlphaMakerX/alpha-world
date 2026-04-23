/**
 * API 访问令牌数据库表定义（Drizzle ORM Schema）
 *
 * 定义 user_api_tokens 表结构，每个用户最多持有一个 API 令牌。
 * 令牌以 SHA-256 哈希（64 字符 hex）存储，用户删除时级联删除令牌。
 */

import { char, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/server/features/person/infrastructure/schema";

/** 用户 API 令牌表，以 userId 为主键（每用户一条记录） */
export const userApiTokens = pgTable("user_api_tokens", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** SHA-256 哈希值，固定 64 字符长度 */
  tokenHash: char("token_hash", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 查询结果对应的 TypeScript 类型 */
export type UserApiTokenRecord = typeof userApiTokens.$inferSelect;
/** 插入数据对应的 TypeScript 类型 */
export type NewUserApiTokenRecord = typeof userApiTokens.$inferInsert;
