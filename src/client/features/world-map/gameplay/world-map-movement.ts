/**
 * 世界地图玩家移动逻辑
 *
 * 处理键盘方向键输入，将玩家限制在道路区域内移动。
 * 使用分轴检测的方式，使玩家在贴墙时仍能沿另一轴滑动，
 * 减少转角处的阻塞感。
 */
import type * as Phaser from 'phaser'

/** 移动向量 */
type MovementVector = {
  vx: number
  vy: number
}

/** 玩家位置坐标 */
type PlayerPosition = {
  x: number
  y: number
}

/** movePlayerByCursorsOnRoads 函数的参数类型 */
type MovePlayerByCursorsParams = {
  player: PlayerPosition
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  roads: Phaser.Geom.Rectangle[]
  moveSpeed: number
  deltaMs: number
  playerRadius: number
  playerFootOffsetY: number
}

/** 判断点 (x, y) 是否在矩形内 */
function isPointInsideRectangle(rectangle: Phaser.Geom.Rectangle, x: number, y: number): boolean {
  return (
    x >= rectangle.x &&
    x <= rectangle.x + rectangle.width &&
    y >= rectangle.y &&
    y <= rectangle.y + rectangle.height
  )
}

/** 判断点 (x, y) 是否在任意一条道路上 */
function isPointOnRoad(roads: Phaser.Geom.Rectangle[], x: number, y: number): boolean {
  return roads.some((road) => isPointInsideRectangle(road, x, y))
}

/** 检测玩家以给定半径站在 (x, y) 时，四个边缘点是否都在道路上 */
function canPlayerStandAt(
  roads: Phaser.Geom.Rectangle[],
  x: number,
  y: number,
  radius: number,
): boolean {
  return (
    isPointOnRoad(roads, x - radius, y) &&
    isPointOnRoad(roads, x + radius, y) &&
    isPointOnRoad(roads, x, y - radius) &&
    isPointOnRoad(roads, x, y + radius)
  )
}

/** 根据方向键按下状态生成移动向量 */
function getMovementVectorFromCursors(
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  step: number,
): MovementVector {
  let vx = 0
  let vy = 0

  if (cursors.left.isDown) {
    vx -= step
  }
  if (cursors.right.isDown) {
    vx += step
  }
  if (cursors.up.isDown) {
    vy -= step
  }
  if (cursors.down.isDown) {
    vy += step
  }

  return { vx, vy }
}

/**
 * 根据方向键输入在道路范围内移动玩家
 *
 * 采用分轴移动策略：先尝试 X 方向，再尝试 Y 方向，
 * 使得贴墙时仍能沿另一个方向滑动。
 */
export function movePlayerByCursorsOnRoads(params: MovePlayerByCursorsParams): void {
  const { player, cursors, roads, moveSpeed, deltaMs, playerRadius, playerFootOffsetY } = params
  const step = moveSpeed * (deltaMs / 1000)
  const { vx, vy } = getMovementVectorFromCursors(cursors, step)

  if (vx === 0 && vy === 0) {
    return
  }

  const targetX = player.x + vx
  const targetY = player.y + vy
  const footY = player.y + playerFootOffsetY

  // 分轴移动可降低贴墙转角时的阻塞感。
  if (canPlayerStandAt(roads, targetX, footY, playerRadius)) {
    player.x = targetX
  }
  if (canPlayerStandAt(roads, player.x, targetY + playerFootOffsetY, playerRadius)) {
    player.y = targetY
  }
}
