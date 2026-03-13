import type { FactoryOrderStatus } from "@/client/features/building/types/building-ui";

export const factoryOrderStatusLabelByValue: Record<FactoryOrderStatus, string> = {
  in_progress: "进行中",
  collected: "已收取",
  cancelled: "已取消",
};

export const formatDateTime = (value: Date | string | null) => {
  if (!value) {
    return "无";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "无";
  }
  return date.toLocaleString("zh-CN");
};

export const formatItemStacks = (items: Array<{ itemKey: string; quantity: number }>) =>
  items.length ? items.map((item) => `${item.itemKey} x${item.quantity}`).join("，") : "无";
