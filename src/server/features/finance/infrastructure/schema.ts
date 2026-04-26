/**
 * Finance 模块数据库表结构定义
 *
 * 使用 Drizzle ORM 定义 money_transactions 表的 Schema，
 * 包含字段约束、索引和 CHECK 约束。
 */
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
import { users } from "@/server/features/person/infrastructure/schema";

/** 资金交易流水表：记录所有用户间的资金流转 */
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
