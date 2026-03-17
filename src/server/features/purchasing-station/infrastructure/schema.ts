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

export const buyOrders = pgTable(
  "buy_orders",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    buildingId: bigint("building_id", { mode: "number" })
      .notNull()
      .references(() => buildings.id, { onDelete: "cascade" }),
    buyerUserId: uuid("buyer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemKey: varchar("item_key", { length: 50 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("buy_orders_quantity_chk", sql`${table.quantity} > 0`),
    check("buy_orders_unit_price_chk", sql`${table.unitPrice} >= 0`),
    check("buy_orders_status_chk", sql`${table.status} in ('active', 'fulfilled', 'cancelled')`),
    index("idx_buy_orders_buyer_user_id").on(table.buyerUserId),
    index("idx_buy_orders_status").on(table.status),
  ],
);
