export const PLAYER_MAX_STAMINA = 100;
export const PLAYER_STAMINA_COST_PER_PIXEL = 0.04;
export const PLAYER_STAMINA_RECOVERY_DELAY_MS = 5000;
export const PLAYER_STAMINA_RECOVERY_PER_SECOND = 0.18;

export function calculateStaminaCostByDistance(distance: number): number {
  if (!Number.isFinite(distance) || distance <= 0) {
    return 0;
  }
  return distance * PLAYER_STAMINA_COST_PER_PIXEL;
}
