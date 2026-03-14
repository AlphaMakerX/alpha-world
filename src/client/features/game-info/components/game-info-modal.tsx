"use client";

import { Modal, Tabs, Spin } from "antd";
import { trpc } from "@/client/lib/trpc";

type GameInfoModalProps = {
  open: boolean;
  onClose: () => void;
};

function GameRulesTab() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-700">
      <section>
        <h3 className="mb-1.5 font-semibold text-slate-900">游戏简介</h3>
        <p>
          Alpha World
          是一个模拟经营类游戏。玩家在世界地图上购买地块、建造建筑、生产商品并进行交易，积累财富成为最富有的玩家。
        </p>
      </section>

      <section>
        <h3 className="mb-1.5 font-semibold text-slate-900">注册与初始资金</h3>
        <p>
          新注册的玩家将获得{" "}
          <span className="font-semibold text-orange-700">10,000</span>{" "}
          金币作为初始资金，由系统发放。
        </p>
      </section>

      <section>
        <h3 className="mb-1.5 font-semibold text-slate-900">购买地块</h3>
        <p>
          世界地图上有若干空闲地块可供购买，每块地有固定价格。购买后该地块归你所有，可在上面建造建筑。
        </p>
      </section>

      <section>
        <h3 className="mb-1.5 font-semibold text-slate-900">建造建筑</h3>
        <p>拥有地块后，可以建造以下类型的建筑：</p>
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 font-medium text-slate-600">类型</th>
                <th className="px-3 py-2 font-medium text-slate-600">费用</th>
                <th className="px-3 py-2 font-medium text-slate-600">用途</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-3 py-2">住宅</td>
                <td className="px-3 py-2 tabular-nums">500</td>
                <td className="px-3 py-2 text-slate-500">基础建筑</td>
              </tr>
              <tr>
                <td className="px-3 py-2">工厂</td>
                <td className="px-3 py-2 tabular-nums">800</td>
                <td className="px-3 py-2 text-slate-500">生产商品</td>
              </tr>
              <tr>
                <td className="px-3 py-2">商店</td>
                <td className="px-3 py-2 tabular-nums">600</td>
                <td className="px-3 py-2 text-slate-500">出售商品</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-1.5 font-semibold text-slate-900">工厂生产</h3>
        <p>
          工厂可以按照配方将原料加工为成品。生产需要消耗金币和/或原料，完成后产出会存入你的背包。
        </p>
      </section>

      <section>
        <h3 className="mb-1.5 font-semibold text-slate-900">商店交易</h3>
        <p>
          商店是玩家之间进行交易的场所。你可以在自己的商店上架商品，其他玩家可以购买。交易金额直接在买卖双方之间流转。
        </p>
      </section>

      <section>
        <h3 className="mb-1.5 font-semibold text-slate-900">资金流向</h3>
        <p>
          购买地块、建造建筑、工厂生产的费用均流入系统。商店交易则是玩家间直接转账（P2P）。合理规划你的资金，争取登上财富排行榜！
        </p>
      </section>
    </div>
  );
}

function WealthLeaderboardTab() {
  const { data, isLoading } = trpc.person.wealthLeaderboard.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spin />
      </div>
    );
  }

  const entries = data?.entries ?? [];

  if (entries.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        暂无数据
      </div>
    );
  }

  const medalColors = [
    "bg-amber-100 text-amber-700 border-amber-300",
    "bg-slate-100 text-slate-600 border-slate-300",
    "bg-orange-100 text-orange-700 border-orange-300",
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="w-16 px-3 py-2 text-center font-medium text-slate-600">排名</th>
            <th className="px-3 py-2 font-medium text-slate-600">玩家</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">财富</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <tr key={entry.rank} className={entry.rank <= 3 ? "bg-amber-50/40" : ""}>
              <td className="px-3 py-2 text-center">
                {entry.rank <= 3 ? (
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${medalColors[entry.rank - 1]}`}
                  >
                    {entry.rank}
                  </span>
                ) : (
                  <span className="text-slate-400">{entry.rank}</span>
                )}
              </td>
              <td className="px-3 py-2 font-medium text-slate-800">{entry.username}</td>
              <td className="px-3 py-2 text-right tabular-nums text-orange-700">
                {entry.money.toLocaleString("zh-CN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdamProfileTab() {
  const { data, isLoading } = trpc.person.adamProfile.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spin />
      </div>
    );
  }

  const money = data?.money ?? 0;
  const transactions = data?.transactions ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
        <p className="text-xs font-medium text-violet-600">Adam（系统央行）当前余额</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-violet-900">
          {money.toLocaleString("zh-CN")}
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">交易日志（最近 100 条）</h4>
        {transactions.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-slate-400">
            暂无交易记录
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-600">时间</th>
                  <th className="px-3 py-2 font-medium text-slate-600">类型</th>
                  <th className="px-3 py-2 font-medium text-slate-600">对方</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{tx.type}</td>
                    <td className="px-3 py-2 text-slate-700">{tx.counterparty}</td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums font-medium ${
                        tx.direction === "in" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {tx.direction === "in" ? "+" : "-"}
                      {tx.amount.toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function GameInfoModal({ open, onClose }: GameInfoModalProps) {
  return (
    <Modal
      title="游戏信息"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={560}
    >
      <Tabs
        defaultActiveKey="rules"
        items={[
          {
            key: "rules",
            label: "游戏规则",
            children: <GameRulesTab />,
          },
          {
            key: "leaderboard",
            label: "财富排行榜",
            children: <WealthLeaderboardTab />,
          },
          {
            key: "adam",
            label: "央行 Adam",
            children: <AdamProfileTab />,
          },
        ]}
      />
    </Modal>
  );
}
