/**
 * 收购站收购订单数据库表结构定义（Drizzle ORM schema）
 *
 * 定义了 buy_orders 表的字段、类型、约束和索引，
 * 用于持久化收购站中收购订单的数据。
 */

import {
  bigint,
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { buildings } from "@/server/features/building/infrastructure/schema";
import { users } from "@/server/features/person/infrastructure/schema";

/** 收购订单表 */
export const buyOrders = pgTable(
  "buy_orders",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    /** 所属建筑 ID，级联删除 */
    buildingId: bigint("building_id", { mode: "number" })
      .notNull()
      .references(() => buildings.id, { onDelete: "cascade" }),
    /** 收购方用户 ID，级联删除 */
    buyerUserId: uuid("buyer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 物品标识键 */
    itemKey: varchar("item_key", { length: 50 }).notNull(),
    /** 收购数量 */
    quantity: integer("quantity").notNull(),
    /** 单价（精度 12 位，小数点后 2 位） */
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    /** 状态：active-进行中 / fulfilled-已完成 / cancelled-已取消 */
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // 数据库层面的约束检查
    check("buy_orders_quantity_chk", sql`${table.quantity} > 0`),
    check("buy_orders_unit_price_chk", sql`${table.unitPrice} >= 0`),
    check("buy_orders_status_chk", sql`${table.status} in ('active', 'fulfilled', 'cancelled')`),
    index("idx_buy_orders_buyer_user_id").on(table.buyerUserId),
    index("idx_buy_orders_status").on(table.status),
  ],
);
