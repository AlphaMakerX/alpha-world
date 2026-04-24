/**
 * 工厂已解锁配方表数据库 Schema 定义
 *
 * 记录每座工厂已解锁的配方，复合主键 (building_id, recipe_id)。
 * 建筑删除时通过 CASCADE 自动清除关联的解锁记录。
 */
import {
  bigint,
  index,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { buildings } from "@/server/features/building/infrastructure/schema";

/** 工厂已解锁配方表（factory_unlocked_recipes） */
export const factoryUnlockedRecipes = pgTable(
  "factory_unlocked_recipes",
  {
    buildingId: bigint("building_id", { mode: "number" })
      .notNull()
      .references(() => buildings.id, { onDelete: "cascade" }),
    recipeId: varchar("recipe_id", { length: 50 }).notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.buildingId, table.recipeId] }),
    index("idx_unlocked_recipes_building_id").on(table.buildingId),
  ],
);
