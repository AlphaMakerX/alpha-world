/**
 * Person 模块数据库表结构定义
 *
 * 使用 Drizzle ORM 定义 users 表的 Schema，
 * 包含字段约束、索引和 CHECK 约束。
 */
import {
  check,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** 用户表：存储用户基本信息、资金、坐标和体力数据 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 32 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    money: numeric("money", { precision: 12, scale: 2 }).notNull().default("10000"),
    positionX: numeric("position_x", { precision: 10, scale: 2 }).notNull().default("140"),
    positionY: numeric("position_y", { precision: 10, scale: 2 }).notNull().default("600"),
    staminaCurrent: numeric("stamina_current", { precision: 10, scale: 2 }).notNull().default("100"),
    staminaMax: numeric("stamina_max", { precision: 10, scale: 2 }).notNull().default("100"),
    staminaUpdatedAt: timestamp("stamina_updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("users_username_length_chk", sql`char_length(${table.username}) between 3 and 32`),
    check("users_money_chk", sql`${table.money} >= 0`),
    check("users_position_x_chk", sql`${table.positionX} >= 0`),
    check("users_position_y_chk", sql`${table.positionY} >= 0`),
    check("users_stamina_current_chk", sql`${table.staminaCurrent} >= 0`),
    check("users_stamina_max_chk", sql`${table.staminaMax} > 0`),
    check("users_stamina_within_max_chk", sql`${table.staminaCurrent} <= ${table.staminaMax}`),
  ],
);

/** 用户表查询结果类型 */
export type UserRecord = typeof users.$inferSelect;
/** 用户表插入数据类型 */
export type NewUserRecord = typeof users.$inferInsert;
