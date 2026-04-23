/**
 * 工厂生产任务表数据库 Schema 定义
 *
 * 使用 Drizzle ORM 定义 factory_production_jobs 表结构，
 * 记录工厂中每次生产任务的输入/输出材料、状态和时间信息。
 */
import {
  bigint,
  check,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { buildings } from "@/server/features/building/infrastructure/schema";
import { users } from "@/server/features/person/infrastructure/schema";

/** 工厂生产任务表（factory_production_jobs） */
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
