import { z } from "zod";
import { eq, and, inArray, desc } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { DomainError } from "@/server/features/shared-kernel/domain/domain-error";
import { buildingRepository } from "@/server/features/building/infrastructure";
import { buyOrders } from "@/server/features/purchasing-station/infrastructure/schema";
import { moneyTransactions, users } from "@/server/features/person/infrastructure/schema";

const getPurchasingStationTransactionHistorySchema = z.object({
  buildingId: z.number().int().positive(),
});

type PurchasingStationTransaction = {
  id: number;
  sellerUsername: string;
  amount: number;
  description: string | null;
  createdAt: Date;
};

type GetPurchasingStationTransactionHistorySuccessResult = {
  ok: true;
  transactions: PurchasingStationTransaction[];
};

type GetPurchasingStationTransactionHistoryFailureResult = {
  ok: false;
  error: string;
  status: 400 | 404 | 409;
};

export type GetPurchasingStationTransactionHistoryResult =
  | GetPurchasingStationTransactionHistorySuccessResult
  | GetPurchasingStationTransactionHistoryFailureResult;

export async function executeGetPurchasingStationTransactionHistoryUseCase(
  input: unknown,
): Promise<GetPurchasingStationTransactionHistoryResult> {
  const parsed = getPurchasingStationTransactionHistorySchema.safeParse(input);
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
    building.ensurePurchasingStation();
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: error.message, status: 409 };
    }
    throw error;
  }

  const orders = await db.query.buyOrders.findMany({
    where: eq(buyOrders.buildingId, parsed.data.buildingId),
    columns: { id: true },
  });

  if (orders.length === 0) {
    return { ok: true, transactions: [] };
  }

  const orderIds = orders.map((o) => String(o.id));

  const rows = await db
    .select({
      id: moneyTransactions.id,
      sellerUsername: users.username,
      amount: moneyTransactions.amount,
      description: moneyTransactions.description,
      createdAt: moneyTransactions.createdAt,
    })
    .from(moneyTransactions)
    .innerJoin(users, eq(moneyTransactions.toUserId, users.id))
    .where(
      and(
        eq(moneyTransactions.type, "buy_order_fulfilled"),
        inArray(moneyTransactions.referenceId, orderIds),
      ),
    )
    .orderBy(desc(moneyTransactions.createdAt))
    .limit(50);

  return {
    ok: true,
    transactions: rows.map((row) => ({
      id: row.id,
      sellerUsername: row.sellerUsername,
      amount: Number(row.amount),
      description: row.description,
      createdAt: row.createdAt,
    })),
  };
}
