/**
 * 建筑表数据库 Schema 定义
 *
 * 使用 Drizzle ORM 定义 plot_buildings 表结构，
 * 建筑通过外键关联地块（plots）表，每个地块最多一栋建筑（unique 约束）。
 */
import {
  bigint,
  check,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { plots } from "@/server/features/plot/infrastructure/schema";

/** 建筑表（plot_buildings） */
export const buildings = pgTable(
  "plot_buildings",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    plotId: bigint("plot_id", { mode: "number" })
      .notNull()
      .references(() => plots.id, { onDelete: "cascade" })
      .unique(),
    type: varchar("type", { length: 20 }).notNull(),
    subtype: varchar("subtype", { length: 30 }),
    level: integer("level").notNull().default(1),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // check("plot_buildings_type_chk", sql`${table.type} in ('residential', 'factory', 'shop', 'purchasing_station')`),
    check("plot_buildings_status_chk", sql`${table.status} in ('active')`),
  ],
);
