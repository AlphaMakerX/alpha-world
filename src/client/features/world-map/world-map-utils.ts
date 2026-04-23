/**
 * 世界地图通用工具函数
 *
 * 提供距离计算和查询初始加载状态判断等辅助方法。
 */

/** 计算两个坐标点之间的欧氏距离 */
export function getDistance(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

/**
 * 判断查询是否处于首次加载状态
 *
 * 当查询已启用（enabled）、尚无数据且正在加载或拉取中时返回 true，
 * 用于展示首屏 loading 状态。
 */
export function isInitialQueryLoading(options: {
  enabled: boolean;
  hasData: boolean;
  isLoading: boolean;
  isFetching: boolean;
}): boolean {
  const { enabled, hasData, isLoading, isFetching } = options;
  return enabled && !hasData && (isLoading || isFetching);
}
