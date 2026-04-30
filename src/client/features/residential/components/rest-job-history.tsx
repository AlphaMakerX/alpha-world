/**
 * 休息记录组件
 *
 * 展示住宅的所有已完成休息订单历史。
 */

import type { RestJobSnapshot } from "./residential-section";

type RestJobHistoryProps = {
  jobs: RestJobSnapshot[];
};

/** 格式化日期时间为中文格式 */
function formatDateTime(value: Date | string | null) {
  if (!value) return "无";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "无";
  return date.toLocaleString("zh-CN");
}

/** 休息记录组件 */
export function RestJobHistory({ jobs }: RestJobHistoryProps) {
  const historyJobs = jobs.filter((j) => j.status === "collected");

  if (historyJobs.length === 0) {
    return <p className="text-sm text-slate-500">暂无休息记录</p>;
  }

  return (
    <div className="space-y-2">
      {historyJobs.map((job) => (
        <div
          key={job.id}
          className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[11px] text-slate-400">#{job.id}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">住宅休息</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              已收取
            </span>
          </div>
          <div className="mt-2 rounded-lg bg-slate-50/80 p-2.5">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>⚡ +{job.staminaGain} 体力</span>
              <span className="text-slate-300">·</span>
              <span>¥ {job.cost} 金币</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
            <span>开始 <span className="text-slate-500">{formatDateTime(job.startedAt)}</span></span>
            <span>完成 <span className="text-slate-500">{formatDateTime(job.finishAt)}</span></span>
            {job.collectedAt && (
              <span>收取 <span className="text-slate-500">{formatDateTime(job.collectedAt)}</span></span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
