export function getDistance(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

export function isInitialQueryLoading(options: {
  enabled: boolean;
  hasData: boolean;
  isLoading: boolean;
  isFetching: boolean;
}): boolean {
  const { enabled, hasData, isLoading, isFetching } = options;
  return enabled && !hasData && (isLoading || isFetching);
}
