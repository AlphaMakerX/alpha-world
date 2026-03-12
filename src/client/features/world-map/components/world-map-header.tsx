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

  return (
    <div className="z-10 flex w-full justify-center p-4">
      <div
        className={`flex min-w-[320px] max-w-[720px] flex-1 items-center rounded-lg bg-white/90 px-4 py-2 shadow-sm backdrop-blur ${
          isAuthenticated ? "justify-between" : "justify-end"
        }`}
      >
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900">余额：{displayMoney}</span>
            <Button size="small" onClick={() => void onOpenInventoryClick()}>
              背包
            </Button>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">{displayStatus}</span>
          {isAuthenticated ? (
            <Button size="small" onClick={() => void onLogoutClick()} loading={logoutLoading}>
              登出
            </Button>
          ) : (
            <Button type="primary" size="small" onClick={() => void onLoginClick()}>
              登录 / 注册
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
