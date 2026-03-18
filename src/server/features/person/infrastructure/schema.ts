import {
  bigint,
  check,
  index,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 32 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    money: numeric("money", { precision: 12, scale: 2 }).notNull().default("10000"),
    positionX: numeric("position_x", { precision: 10, scale: 2 }).notNull().default("140"),
    positionY: numeric("position_y", { precision: 10, scale: 2 }).notNull().default("600"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("users_username_length_chk", sql`char_length(${table.username}) between 3 and 32`),
    check("users_money_chk", sql`${table.money} >= 0`),
    check("users_position_x_chk", sql`${table.positionX} >= 0`),
    check("users_position_y_chk", sql`${table.positionY} >= 0`),
  ],
);

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

export const moneyTransactions = pgTable(
  "money_transactions",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    type: varchar("type", { length: 30 }).notNull(),
    referenceId: varchar("reference_id", { length: 100 }),
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("money_transactions_amount_chk", sql`${table.amount} > 0`),
    index("idx_money_transactions_from_user_id").on(table.fromUserId),
    index("idx_money_transactions_to_user_id").on(table.toUserId),
    index("idx_money_transactions_type").on(table.type),
  ],
);
