"use client";

import { Modal } from "antd";
import type { AuthStatus } from "@/client/types/auth-ui";

type PersonDetailModalProps = {
  open: boolean;
  authStatus: AuthStatus;
  username?: string;
  money?: number;
  plotCount: number;
  buildingCount: number;
  onClose: () => void;
};

export function PersonDetailModal({
  open,
  authStatus,
  username,
  money,
  plotCount,
  buildingCount,
  onClose,
}: PersonDetailModalProps) {
  const displayMoney = Number(money ?? 0).toLocaleString("zh-CN");

  return (
    <Modal title="人物详情" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      {authStatus !== "authenticated" ? (
        <p className="text-sm text-slate-500">请先登录后查看人物详情</p>
      ) : (
        <div className="space-y-3 text-sm text-slate-700">
          <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2">
            <p className="font-medium text-violet-800">{username ?? "未知用户"}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
              <p className="text-xs text-orange-700">余额</p>
              <p className="font-semibold tabular-nums text-orange-900">{displayMoney}</p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-700">地块</p>
              <p className="font-semibold tabular-nums text-emerald-900">{plotCount}</p>
            </div>
            <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2">
              <p className="text-xs text-sky-700">建筑</p>
              <p className="font-semibold tabular-nums text-sky-900">{buildingCount}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
