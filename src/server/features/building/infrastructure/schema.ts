import {
  bigint,
  check,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { plots } from "@/server/features/plot/infrastructure/schema";

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
    // check("plot_buildings_type_chk", sql`${table.type} in ('residential', 'factory', 'shop', 'purchasing_station')`),
    check("plot_buildings_status_chk", sql`${table.status} in ('active')`),
  ],
);
