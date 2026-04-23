/**
 * 库存表的数据库 Schema 定义
 * 使用 Drizzle ORM 定义 inventories 表结构，
 * 记录每个用户持有的各类物品及其数量。
 */

import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "@/server/features/person/infrastructure/schema";

/** 库存表：以 (用户ID, 物品标识) 为联合主键，记录用户持有的物品数量 */
export const inventories = pgTable(
  "inventories",
  {
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // 关联用户表，级联删除
    itemKey: varchar("item_key", { length: 50 }).notNull(), // 物品唯一标识
    quantity: integer("quantity").notNull().default(0), // 持有数量，默认 0
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerUserId, table.itemKey], name: "inventories_pk" }), // 联合主键
    check("inventories_quantity_chk", sql`${table.quantity} >= 0`), // 数量不能为负数的约束
    index("idx_inventories_owner_user_id").on(table.ownerUserId), // 按用户 ID 查询的索引
  ],
);
