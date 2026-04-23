/**
 * 世界地图 Phaser 场景常量
 *
 * 定义地图尺寸、道路布局、玩家碰撞体积、地块尺寸等基础参数，
 * 供场景创建、道路绘制、地块排布和移动碰撞检测共用。
 */

export const MAP_WIDTH = 3200                              // 地图总宽度（像素）
export const MAP_HEIGHT = 1200                             // 地图总高度（像素）
export const SCENE_KEY = 'world-map'                       // Phaser 场景唯一标识
export const CAMERA_LERP = 0.1                             // 相机跟随插值系数（越小越平滑）
export const ROAD_WIDTH = 63                               // 道路宽度（像素）
export const PLAYER_RADIUS = 8                             // 玩家碰撞半径（像素）
export const PLAYER_FOOT_OFFSET_Y = -8                     // 玩家脚部相对精灵中心的 Y 偏移
export const INSPECT_DISTANCE = 70                         // 玩家接近地块触发检视的距离阈值
export const VERTICAL_ROAD_CENTERS = [800, 1600, 2400]     // 纵向道路中心 X 坐标
export const PLOT_WIDTH = 50                               // 地块宽度（像素）
export const PLOT_HEIGHT = 60                              // 地块高度（像素）
