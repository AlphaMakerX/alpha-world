/**
 * 住宅休息类型配置目录
 *
 * 定义住宅休息的静态配置数据。
 */

/** 休息类型配置 */
export type RestTypeConfig = {
  id: string;
  durationSeconds: number;
  staminaGain: number;
  defaultCost: number;
};

/** 完全休息：单一档位 */
export const FULL_REST: RestTypeConfig = {
  id: "full_rest",
  durationSeconds: 300,
  staminaGain: 1000,
  defaultCost: 500,
};

/** 按 ID 获取休息类型配置 */
export function getRestTypeById(id: string): RestTypeConfig | null {
  if (id === FULL_REST.id) return FULL_REST;
  return null;
}
