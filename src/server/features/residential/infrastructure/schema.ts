/**
 * 住宅休息任务表数据库 Schema 定义
 *
 * 使用 Drizzle ORM 定义 residential_rest_jobs 表结构，
 * 记录玩家在住宅中发起的每次休息任务。
 */
import {
  bigint,
  check,
  index,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { buildings } from "@/server/features/building/infrastructure/schema";
import { users } from "@/server/features/person/infrastructure/schema";

/** 住宅休息任务表（residential_rest_jobs） */
export const residentialRestJobs = pgTable(
  "residential_rest_jobs",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    buildingId: bigint("building_id", { mode: "number" })
      .notNull()
      .references(() => buildings.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resterUserId: uuid("rester_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restType: varchar("rest_type", { length: 20 }).notNull(),
    staminaGain: numeric("stamina_gain", { precision: 10, scale: 2 }).notNull(),
    cost: numeric("cost", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishAt: timestamp("finish_at", { withTimezone: true }).notNull(),
    collectedAt: timestamp("collected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "residential_rest_jobs_status_chk",
      sql`${table.status} in ('in_progress', 'collected')`,
    ),
    index("idx_rest_jobs_building_id").on(table.buildingId),
    index("idx_rest_jobs_rester_user_id").on(table.resterUserId),
    index("idx_rest_jobs_status").on(table.status),
  ],
);
