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

export const shopListings = pgTable(
  "shop_listings",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    buildingId: bigint("building_id", { mode: "number" })
      .notNull()
      .references(() => buildings.id, { onDelete: "cascade" }),
    sellerUserId: uuid("seller_user_id")
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
    check("shop_listings_quantity_chk", sql`${table.quantity} > 0`),
    check("shop_listings_unit_price_chk", sql`${table.unitPrice} >= 0`),
    check("shop_listings_status_chk", sql`${table.status} in ('active', 'sold', 'cancelled')`),
    index("idx_shop_listings_seller_user_id").on(table.sellerUserId),
    index("idx_shop_listings_status").on(table.status),
  ],
);
