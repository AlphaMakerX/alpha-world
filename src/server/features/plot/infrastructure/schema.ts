/**
 * Plot 模块数据库表结构定义
 *
 * 使用 Drizzle ORM 定义 plots 表的 Schema，
 * 包含坐标唯一约束、状态检查约束和索引。
 */
import {
  bigint,
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "@/server/features/person/infrastructure/schema";

/** 地块表：存储地块坐标、归属、状态和价格 */
export const plots = pgTable(
  "plots",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).notNull().default("available"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("plots_coordinates_unique").on(table.x, table.y),
    check("plots_status_chk", sql`${table.status} in ('available', 'owned', 'locked')`),
    check("plots_price_chk", sql`${table.price} >= 0`),
    index("idx_plots_owner_user_id").on(table.ownerUserId),
    index("idx_plots_status").on(table.status),
  ],
);
