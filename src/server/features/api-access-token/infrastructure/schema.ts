import { char, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/server/features/person/infrastructure/schema";

export const userApiTokens = pgTable("user_api_tokens", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: char("token_hash", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserApiTokenRecord = typeof userApiTokens.$inferSelect;
export type NewUserApiTokenRecord = typeof userApiTokens.$inferInsert;
