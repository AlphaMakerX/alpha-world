/**
 * 系统初始化仓储的 Drizzle ORM 实现
 *
 * 提供系统初始化过程中需要的数据库操作，包括转账记录查重和地块批量 upsert。
 */

import { and, eq, sql } from "drizzle-orm";
import { moneyTransactions } from "@/server/features/person/infrastructure/schema";
import { plots } from "@/server/features/plot/infrastructure/schema";
import { getDbClient } from "@/server/lib/db";

/** 基于 Drizzle ORM 的系统初始化仓储 */
export class DrizzleSystemInitializationRepository {
  /** 检查是否已存在指定的转账记录（用于幂等性保障） */
  async hasMoneyTransfer(input: {
    fromUserId: string;
    toUserId: string;
    referenceId: string;
  }): Promise<boolean> {
    const existing = await getDbClient().query.moneyTransactions.findFirst({
      where: and(
        eq(moneyTransactions.fromUserId, input.fromUserId),
        eq(moneyTransactions.toUserId, input.toUserId),
        eq(moneyTransactions.referenceId, input.referenceId),
      ),
    });
    return Boolean(existing);
  }

  /**
   * 批量插入或更新地块价格（仅更新无主地块）
   *
   * 按行列网格生成所有地块数据，使用 upsert：
   * - 新地块直接插入
   * - 已有但无主的地块更新价格
   * - 已被购买的地块（ownerUserId 非 NULL）保持不变
   */
  async upsertPlotsPriceIfUnowned(input: {
    totalRows: number;
    colsPerRow: number;
    minPrice: number;
    maxPrice: number;
  }): Promise<void> {
    // 生成所有地块的初始数据
    const values: Array<typeof plots.$inferInsert> = [];
    for (let row = 1; row <= input.totalRows; row += 1) {
      for (let col = 1; col <= input.colsPerRow; col += 1) {
        // 在价格区间内随机生成价格
        const price =
          Math.floor(Math.random() * (input.maxPrice - input.minPrice + 1)) + input.minPrice;
        values.push({
          x: row,
          y: col,
          price: price.toFixed(2),
          status: "available",
          ownerUserId: null,
        });
      }
    }

    // upsert：坐标冲突时仅在 ownerUserId 为 NULL 时更新价格
    await getDbClient()
      .insert(plots)
      .values(values)
      .onConflictDoUpdate({
        target: [plots.x, plots.y],
        set: {
          price: sql`excluded.price`,
          updatedAt: sql`now()`,
        },
        setWhere: sql`${plots.ownerUserId} IS NULL`,
      });
  }
}

/** 仓储单例实例 */
export const systemInitializationRepository = new DrizzleSystemInitializationRepository();
