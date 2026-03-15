import { z } from "zod";
import { eq, and, inArray, desc } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { shopListings } from "@/server/features/building/infrastructure/schema";
import { moneyTransactions, users } from "@/server/features/person/infrastructure/schema";

const getShopTransactionHistorySchema = z.object({
  buildingId: z.number().int().positive(),
});

type ShopTransaction = {
  id: number;
  buyerUsername: string;
  amount: number;
  description: string | null;
  createdAt: Date;
};

type GetShopTransactionHistorySuccessResult = {
  ok: true;
  transactions: ShopTransaction[];
};

type GetShopTransactionHistoryFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type GetShopTransactionHistoryResult =
  | GetShopTransactionHistorySuccessResult
  | GetShopTransactionHistoryFailureResult;

export async function executeGetShopTransactionHistoryUseCase(
  input: unknown,
): Promise<GetShopTransactionHistoryResult> {
  const parsed = getShopTransactionHistorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "参数校验失败",
      status: 400,
    };
  }

  const building = await buildingRepository.findById(parsed.data.buildingId);
  if (!building) {
    return { ok: false, error: "建筑不存在", status: 404 };
  }

  try {
    building.ensureShop();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, status: 409 };
    }
    throw error;
  }

  // 查询策略：money_transactions 本身没有 buildingId 字段，无法直接按商店筛选。
  // 但购买商品时会把 listing.id 写入 referenceId（见 purchase-shop-listing-use-case），
  // 所以先拿到该商店所有 listing 的 id，再用它们去 money_transactions 里反查交易记录。
  const listings = await db.query.shopListings.findMany({
    where: eq(shopListings.buildingId, parsed.data.buildingId),
    columns: { id: true },
  });

  if (listings.length === 0) {
    return { ok: true, transactions: [] };
  }

  const listingIds = listings.map((l) => String(l.id));

  // 筛选条件：type = 'shop_purchase' 且 referenceId 在上面的 listingIds 中。
  // join users 表拿到买家用户名（fromUserId 即买家）。
  const rows = await db
    .select({
      id: moneyTransactions.id,
      buyerUsername: users.username,
      amount: moneyTransactions.amount,
      description: moneyTransactions.description,
      createdAt: moneyTransactions.createdAt,
    })
    .from(moneyTransactions)
    .innerJoin(users, eq(moneyTransactions.fromUserId, users.id))
    .where(
      and(
        eq(moneyTransactions.type, "shop_purchase"),
        inArray(moneyTransactions.referenceId, listingIds),
      ),
    )
    .orderBy(desc(moneyTransactions.createdAt))
    .limit(50);

  return {
    ok: true,
    transactions: rows.map((row) => ({
      id: row.id,
      buyerUsername: row.buyerUsername,
      amount: Number(row.amount),
      description: row.description,
      createdAt: row.createdAt,
    })),
  };
}
