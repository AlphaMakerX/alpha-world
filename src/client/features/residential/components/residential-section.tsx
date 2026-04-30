/**
 * 住宅操作面板组件
 *
 * 展示住宅休息功能：发起休息、查看进行中的任务、收取休息、设定对外价格。
 */

import { useState, useEffect } from "react";
import { Button, InputNumber, Popconfirm } from "antd";
import { FULL_REST } from "@/server/features/residential/domain/rest-catalog";

/** 休息任务快照类型 */
export type RestJobSnapshot = {
  id: number;
  buildingId: number;
  ownerUserId: string;
  resterUserId: string;
  restType: string;
  staminaGain: number;
  cost: number;
  status: string;
  startedAt: Date;
  finishAt: Date;
  collectedAt: Date | null;
};

/** 住宅操作面板的 Props */
type ResidentialSectionProps = {
  isOwner: boolean;
  restPrice: number | null;
  jobs: RestJobSnapshot[];
  jobsLoading: boolean;
  startRestLoading: boolean;
  collectRestLoading: boolean;
  setRestPriceLoading: boolean;
  currentUserId?: string;
  onStartRest: () => void;
  onCollectRest: (jobId: number) => void;
  onSetRestPrice: (price: number | null) => void;
};

/** 格式化日期时间为中文格式 */
function formatDateTime(value: Date | string | null) {
  if (!value) return "无";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "无";
  return date.toLocaleString("zh-CN");
}

/** 格式化剩余时间为人类可读的中文格式 */
function formatRemaining(finishAt: Date | string): string {
  const remaining = Math.max(0, new Date(finishAt).getTime() - Date.now());
  if (remaining <= 0) return "即将完成";
  const totalSec = Math.ceil(remaining / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

/** 休息进度 Hook：每秒计算当前进度百分比 */
function useRestProgress(job: RestJobSnapshot | undefined) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!job || job.status !== "in_progress") return;

    const start = new Date(job.startedAt).getTime();
    const end = new Date(job.finishAt).getTime();
    const total = end - start;
    if (total <= 0) {
      setProgress(100);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, Math.max(0, (elapsed / total) * 100)));
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [job?.id, job?.status, job?.startedAt, job?.finishAt]);

  return progress;
}

/** 住宅操作面板组件 */
export function ResidentialSection({
  isOwner,
  restPrice,
  jobs,
  jobsLoading,
  startRestLoading,
  collectRestLoading,
  setRestPriceLoading,
  currentUserId,
  onStartRest,
  onCollectRest,
  onSetRestPrice,
}: ResidentialSectionProps) {
  const [priceInput, setPriceInput] = useState<number | null>(restPrice);
  const [editingPrice, setEditingPrice] = useState(false);

  // 我的进行中任务（包括已到时间待收取的）
  const myInProgressJob = jobs.find((j) => j.status === "in_progress" && j.resterUserId === currentUserId);
  // 其他人真正占用中的任务（仅未到时间的才算占用）
  const otherInProgressJob = jobs.find((j) => j.status === "in_progress" && j.resterUserId !== currentUserId && new Date(j.finishAt).getTime() > Date.now());
  const progress = useRestProgress(myInProgressJob);
  const otherProgress = useRestProgress(otherInProgressJob);
  const canCollect = myInProgressJob && progress >= 100;

  // 确定当前用户需要支付的费用
  const cost = isOwner ? FULL_REST.defaultCost : restPrice;

  return (
    <div className="space-y-3">
      {/* 休息信息 */}
      <div className="rounded-md border border-sky-200 bg-sky-50/80 p-3">
        <p className="font-medium text-slate-800">住宅休息</p>
        <p className="mt-1 text-xs text-slate-600">
          休息 {FULL_REST.durationSeconds / 60} 分钟，恢复 {FULL_REST.staminaGain} 点体力
        </p>
        {cost !== null && (
          <p className="mt-0.5 text-xs text-slate-600">费用：{cost} 金币</p>
        )}
      </div>

      {/* 进行中的任务 */}
      {myInProgressJob ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[11px] text-slate-400">#{myInProgressJob.id}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">住宅休息</span>
            </div>
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                canCollect
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-sky-50 text-sky-700 ring-sky-200",
              ].join(" ")}
            >
              <span className={["inline-block h-1.5 w-1.5 rounded-full", canCollect ? "bg-emerald-400" : "bg-sky-400"].join(" ")} />
              {canCollect ? "可收取" : "休息中"}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-sky-600">{formatRemaining(myInProgressJob.finishAt)}</span>
              <span className="tabular-nums text-slate-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500 transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Rest info */}
          <div className="mt-3 rounded-lg bg-slate-50/80 p-2.5">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>⚡ +{myInProgressJob.staminaGain} 体力</span>
              <span className="text-slate-300">·</span>
              <span>¥ {myInProgressJob.cost} 金币</span>
            </div>
          </div>

          {/* Collect button */}
          <Button
            type="primary"
            block
            size="small"
            className="mt-3"
            disabled={!canCollect}
            loading={collectRestLoading}
            onClick={() => onCollectRest(myInProgressJob.id)}
          >
            {canCollect ? "收取体力" : "休息中..."}
          </Button>
        </div>
      ) : otherInProgressJob ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[11px] text-slate-400">#{otherInProgressJob.id}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">住宅休息</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              其他玩家使用中
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-amber-600">{formatRemaining(otherInProgressJob.finishAt)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400 transition-[width] duration-1000 ease-linear"
                style={{ width: `${otherProgress}%` }}
              />
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-400">每栋住宅同时只能有一个休息任务，请稍后再来</p>
        </div>
      ) : !isOwner && restPrice === null ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-500">该住宅未开放对外休息服务</p>
        </div>
      ) : (
        <Popconfirm
          title={`确认花费 ${cost} 金币开始休息吗？`}
          description={`休息 ${FULL_REST.durationSeconds / 60} 分钟后可收取，恢复 ${FULL_REST.staminaGain} 点体力。`}
          okText="确认"
          cancelText="取消"
          onConfirm={onStartRest}
          disabled={startRestLoading}
        >
          <Button type="primary" block loading={startRestLoading}>
            开始休息（{cost} 金币）
          </Button>
        </Popconfirm>
      )}

      {/* 主人定价面板 */}
      {isOwner ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-700">对外休息定价</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {restPrice === null
              ? "当前未开放对外休息服务"
              : `当前价格：${restPrice} 金币（你获得 90%，系统抽成 10%）`}
          </p>
          {editingPrice ? (
            <div className="mt-2 flex items-center gap-2">
              <InputNumber
                min={10}
                value={priceInput}
                onChange={(v) => setPriceInput(typeof v === "number" ? v : null)}
                size="small"
                className="w-28"
                placeholder="输入价格"
              />
              <Button
                size="small"
                type="primary"
                loading={setRestPriceLoading}
                onClick={() => {
                  onSetRestPrice(priceInput);
                  setEditingPrice(false);
                }}
              >
                保存
              </Button>
              <Button
                size="small"
                onClick={() => {
                  onSetRestPrice(null);
                  setEditingPrice(false);
                  setPriceInput(null);
                }}
              >
                关闭服务
              </Button>
              <Button size="small" onClick={() => setEditingPrice(false)}>
                取消
              </Button>
            </div>
          ) : (
            <Button
              size="small"
              className="mt-2"
              onClick={() => {
                setPriceInput(restPrice);
                setEditingPrice(true);
              }}
            >
              {restPrice === null ? "开放对外服务" : "修改价格"}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
