/**
 * 获取 Adam 资金概况用例
 *
 * 查询 Adam 系统账户的当前余额和最近交易记录，
 * 并将交易类型转换为中文标签用于前端展示。
 */
import type { PersonQueryRepository } from "@/server/features/person/domain/repositories/person-query-repository";

/** Adam 单笔交易的展示模型 */
export type AdamTransaction = {
  id: number;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
};

/** 用例返回结果类型 */
export type GetAdamProfileResult = {
  ok: true;
  money: number;
  transactions: AdamTransaction[];
};

/** 交易类型到中文标签的映射 */
const TYPE_LABELS: Record<string, string> = {
  registration_grant: "注册赠金",
  plot_purchase: "地块购买",
  building_construction: "建造建筑",
  factory_production: "工厂生产",
  shop_purchase: "商店交易",
};

/** 用例依赖 */
export type GetAdamProfileUseCaseDeps = {
  personQueryRepository: PersonQueryRepository;
};

/** 执行获取 Adam 资金概况用例，返回余额和交易列表 */
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
