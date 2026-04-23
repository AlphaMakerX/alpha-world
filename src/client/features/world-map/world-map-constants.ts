/**
 * 世界地图业务层常量
 *
 * 定义玩家位置同步相关的配置参数，
 * 与 Phaser 场景常量（constants.ts）分离，供 React Hook 层使用。
 */
import { MAP_HEIGHT, MAP_WIDTH } from "./constants";

/** 玩家位置 X 坐标最大值，与场景边界一致 */
export const MAP_MAX_X = MAP_WIDTH;
/** 玩家位置 Y 坐标最大值，与场景边界一致 */
export const MAP_MAX_Y = MAP_HEIGHT;

/** 玩家位置上传到服务端的定时间隔（毫秒） */
export const POSITION_SYNC_INTERVAL_MS = 2000;
/** 触发位置同步的最小移动距离（像素），低于此值不上传 */
export const POSITION_MIN_DISTANCE_TO_SYNC = 20;
