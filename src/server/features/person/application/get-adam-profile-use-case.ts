import type { PersonQueryRepository } from "@/server/features/person/domain/repositories/person-query-repository";

export type AdamTransaction = {
  id: number;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
};

export type GetAdamProfileResult = {
  ok: true;
  money: number;
  transactions: AdamTransaction[];
};

const TYPE_LABELS: Record<string, string> = {
  registration_grant: "注册赠金",
  plot_purchase: "地块购买",
  building_construction: "建造建筑",
  factory_production: "工厂生产",
  shop_purchase: "商店交易",
};

export type GetAdamProfileUseCaseDeps = {
  personQueryRepository: PersonQueryRepository;
};

export async function executeGetAdamProfileUseCase(
  deps: GetAdamProfileUseCaseDeps,
): Promise<GetAdamProfileResult> {
  const profile = await deps.personQueryRepository.getAdamProfile(100);
  const transactions: AdamTransaction[] = profile.transactions.map((transaction) => {
    return {
      id: transaction.id,
      direction: transaction.direction,
      counterparty: transaction.counterparty,
      amount: transaction.amount,
      type: TYPE_LABELS[transaction.type] ?? transaction.type,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),
    };
  });

  return { ok: true, money: profile.money, transactions };
}
