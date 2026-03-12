import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { plots, users } from "@/server/features/person/infrastructure/schema";

export const buildings = pgTable(
  "plot_buildings",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    plotId: bigint("plot_id", { mode: "number" })
      .notNull()
      .references(() => plots.id, { onDelete: "cascade" })
      .unique(),
    type: varchar("type", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("plot_buildings_type_chk", sql`${table.type} in ('residential', 'factory', 'shop')`),
    check("plot_buildings_status_chk", sql`${table.status} in ('active')`),
  ],
);

export const inventories = pgTable(
  "inventories",
  {
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemKey: varchar("item_key", { length: 50 }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerUserId, table.itemKey], name: "inventories_pk" }),
    check("inventories_quantity_chk", sql`${table.quantity} >= 0`),
    index("idx_inventories_owner_user_id").on(table.ownerUserId),
  ],
);

export const factoryProductionJobs = pgTable(
  "factory_production_jobs",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    buildingId: bigint("building_id", { mode: "number" })
      .notNull()
      .references(() => buildings.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipeId: varchar("recipe_id", { length: 50 }).notNull(),
    inputs: jsonb("inputs").notNull(),
    outputs: jsonb("outputs").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishAt: timestamp("finish_at", { withTimezone: true }).notNull(),
    collectedAt: timestamp("collected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "factory_production_jobs_status_chk",
      sql`${table.status} in ('in_progress', 'collected', 'cancelled')`,
    ),
    index("idx_factory_jobs_building_id").on(table.buildingId),
    index("idx_factory_jobs_owner_user_id").on(table.ownerUserId),
    index("idx_factory_jobs_status").on(table.status),
  ],
);

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
