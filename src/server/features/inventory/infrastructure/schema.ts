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
