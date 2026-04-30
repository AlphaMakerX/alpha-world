/**
 * 玩家体力系统常量
 *
 * 定义玩家体力上限和自然恢复速率，
 * 供前后端共享使用（shared 目录）。
 */

/** 玩家体力最大值 */
export const PLAYER_MAX_STAMINA = 1000;
/** 玩家体力每秒自然恢复量（10 点/小时） */
export const PLAYER_STAMINA_RECOVERY_PER_SECOND = 10 / 3600;
/** 生产体力消耗系数（每秒配方时长消耗的体力） */
export const STAMINA_COST_PER_SECOND = 0.1;
