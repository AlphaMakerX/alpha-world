/**
 * 商店上架商品数据库表结构定义（Drizzle ORM schema）
 *
 * 定义了 shop_listings 表的字段、类型、约束和索引，
 * 用于持久化商店中上架商品的数据。
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

/** 商店上架商品表 */
export const shopListings = pgTable(
  "shop_listings",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    /** 所属建筑 ID，级联删除 */
    buildingId: bigint("building_id", { mode: "number" })
      .notNull()
      .references(() => buildings.id, { onDelete: "cascade" }),
    /** 卖家用户 ID，级联删除 */
    sellerUserId: uuid("seller_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 物品标识键 */
    itemKey: varchar("item_key", { length: 50 }).notNull(),
    /** 上架数量 */
    quantity: integer("quantity").notNull(),
    /** 单价（精度 12 位，小数点后 2 位） */
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    /** 状态：active-在售 / sold-已售出 / cancelled-已取消 */
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // 数据库层面的约束检查
    check("shop_listings_quantity_chk", sql`${table.quantity} > 0`),
    check("shop_listings_unit_price_chk", sql`${table.unitPrice} >= 0`),
    check("shop_listings_status_chk", sql`${table.status} in ('active', 'sold', 'cancelled')`),
    index("idx_shop_listings_seller_user_id").on(table.sellerUserId),
    index("idx_shop_listings_status").on(table.status),
  ],
);
