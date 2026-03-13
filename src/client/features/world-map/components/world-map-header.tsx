"use client";

import { Button } from "antd";

type WorldMapHeaderProps = {
  authStatus: "authenticated" | "loading" | "unauthenticated";
  username?: string;
  money?: number;
  onOpenInventoryClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  logoutLoading?: boolean;
};

export function WorldMapHeader({
  authStatus,
  username,
  money,
  onOpenInventoryClick,
  onLoginClick,
  onLogoutClick,
  logoutLoading = false,
}: WorldMapHeaderProps) {
  const displayMoney = Number(money ?? 0).toLocaleString("zh-CN");
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
            <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-0.5 text-sm font-semibold tracking-wide tabular-nums text-orange-800">
              余额 · {displayMoney}
            </span>
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
          <span
            className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold tracking-[0.06em] ${statusToneClass}`}
          >
            {displayStatus}
          </span>
          {isAuthenticated ? (
            <Button
              size="small"
              className="!h-7 !cursor-pointer !rounded-full !border-rose-300 !bg-rose-50 !px-3 !font-medium !text-rose-700 !transition-colors !duration-200 motion-reduce:!transition-none hover:!border-rose-400 hover:!bg-rose-100 hover:!text-rose-800 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-rose-400/70 focus-visible:!ring-offset-1"
              onClick={() => void onLogoutClick()}
              loading={logoutLoading}
            >
              登出
            </Button>
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
