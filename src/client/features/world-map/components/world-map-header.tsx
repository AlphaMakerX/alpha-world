"use client";

import { Button, Popconfirm } from "antd";
import type { AuthStatus } from "@/client/types/auth-ui";

type WorldMapHeaderProps = {
  authStatus: AuthStatus;
  username?: string;
  money?: number;
  staminaCurrent?: number;
  staminaMax?: number;
  onOpenProfileClick: () => void;
  onOpenInventoryClick: () => void;
  onOpenGameInfoClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  logoutLoading?: boolean;
};

export function WorldMapHeader({
  authStatus,
  username,
  money,
  staminaCurrent,
  staminaMax,
  onOpenProfileClick,
  onOpenInventoryClick,
  onOpenGameInfoClick,
  onLoginClick,
  onLogoutClick,
  logoutLoading = false,
}: WorldMapHeaderProps) {
  const displayMoney = Number(money ?? 0).toLocaleString("zh-CN");
  const safeMaxStamina = Math.max(1, Number(staminaMax ?? 100));
  const safeCurrentStamina = Math.max(0, Math.min(safeMaxStamina, Number(staminaCurrent ?? safeMaxStamina)));
  const staminaPercent = (safeCurrentStamina / safeMaxStamina) * 100;
  const staminaLabel = `${Math.round(safeCurrentStamina)} / ${Math.round(safeMaxStamina)}`;
  const isAuthenticated = authStatus === "authenticated";
  const displayStatus =
    isAuthenticated
      ? `已登录：${username ?? "未知用户"}`
      : authStatus === "loading"
        ? "登录状态检查中..."
        : "未登录";
  const statusToneClass = isAuthenticated
    ? "border-violet-300 bg-violet-100 text-violet-800"
    : authStatus === "loading"
      ? "border-amber-300 bg-amber-100 text-amber-800"
      : "border-slate-300 bg-slate-100 text-slate-700";
  const staminaToneClass =
    staminaPercent <= 20
      ? "border-rose-300 bg-rose-50 text-rose-700"
      : staminaPercent <= 45
        ? "border-amber-300 bg-amber-50 text-amber-700"
        : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return (
    <div className="z-50 w-full">
      <div
        className={`relative flex h-11 w-full items-stretch overflow-hidden border border-violet-200/80 bg-[#FAF5FF]/90 px-3 py-1.5 shadow-[0_10px_28px_-18px_rgba(124,58,237,0.45)] backdrop-blur-xl ${
          isAuthenticated ? "justify-between" : "justify-end"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-100/70 via-violet-50/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
        {isAuthenticated ? (
          <div className="relative z-[1] flex h-full items-center gap-2">
            <button
              type="button"
              className="h-7 cursor-pointer rounded-full border border-orange-300 bg-orange-50 px-3 py-0.5 text-sm font-semibold tracking-wide tabular-nums text-orange-800 transition-colors duration-200 motion-reduce:transition-none hover:border-orange-400 hover:bg-orange-100 hover:text-orange-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 focus-visible:ring-offset-1"
              onClick={() => void onOpenProfileClick()}
            >
              余额 · {displayMoney}
            </button>
            <Button
              size="small"
              className="!h-7 !cursor-pointer !rounded-full !border-violet-300 !bg-violet-50 !px-3 !font-medium !text-violet-700 !transition-colors !duration-200 motion-reduce:!transition-none hover:!border-violet-400 hover:!bg-violet-100 hover:!text-violet-800 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-violet-400/70 focus-visible:!ring-offset-1"
              onClick={() => void onOpenInventoryClick()}
            >
              背包
            </Button>
          </div>
        ) : null}
        <div className="relative z-[1] flex h-full items-center gap-2">
          <div
            className={`inline-flex h-7 items-center gap-2 rounded-full border px-2 text-xs font-semibold tabular-nums ${staminaToneClass}`}
            title="移动会消耗体力，停止一段时间后恢复"
          >
            <span className="tracking-[0.06em]">体力</span>
            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200/90">
              <div
                className="h-full rounded-full bg-current transition-[width] duration-100"
                style={{ width: `${staminaPercent}%` }}
              />
            </div>
            <span>{staminaLabel}</span>
          </div>
          <Button
            size="small"
            className="!h-7 !cursor-pointer !rounded-full !border-sky-300 !bg-sky-50 !px-3 !font-medium !text-sky-700 !transition-colors !duration-200 motion-reduce:!transition-none hover:!border-sky-400 hover:!bg-sky-100 hover:!text-sky-800 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-sky-400/70 focus-visible:!ring-offset-1"
            onClick={() => void onOpenGameInfoClick()}
          >
            游戏信息
          </Button>
          <span
            className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold tracking-[0.06em] ${statusToneClass}`}
          >
            {displayStatus}
          </span>
          {isAuthenticated ? (
            <Popconfirm
              title="确认登出吗？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => void onLogoutClick()}
              disabled={logoutLoading}
            >
              <Button
                size="small"
                className="!h-7 !cursor-pointer !rounded-full !border-rose-300 !bg-rose-50 !px-3 !font-medium !text-rose-700 !transition-colors !duration-200 motion-reduce:!transition-none hover:!border-rose-400 hover:!bg-rose-100 hover:!text-rose-800 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-rose-400/70 focus-visible:!ring-offset-1"
                loading={logoutLoading}
              >
                登出
              </Button>
            </Popconfirm>
          ) : (
            <Button
              type="primary"
              size="small"
              className="!h-7 !cursor-pointer !rounded-full !border-0 !bg-[#F97316] !px-4 !font-semibold !text-white !transition-colors !duration-200 motion-reduce:!transition-none hover:!bg-orange-500 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-orange-400/70 focus-visible:!ring-offset-1"
              onClick={() => void onLoginClick()}
            >
              登录 / 注册
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
