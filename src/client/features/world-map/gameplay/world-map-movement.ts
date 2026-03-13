import type * as Phaser from 'phaser'

type MovementVector = {
  vx: number
  vy: number
}

type PlayerPosition = {
  x: number
  y: number
}

type MovePlayerByCursorsParams = {
  player: PlayerPosition
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  roads: Phaser.Geom.Rectangle[]
  moveSpeed: number
  deltaMs: number
  playerRadius: number
}

function isPointInsideRectangle(rectangle: Phaser.Geom.Rectangle, x: number, y: number): boolean {
  return (
    x >= rectangle.x &&
    x <= rectangle.x + rectangle.width &&
    y >= rectangle.y &&
    y <= rectangle.y + rectangle.height
  )
}

function isPointOnRoad(roads: Phaser.Geom.Rectangle[], x: number, y: number): boolean {
  return roads.some((road) => isPointInsideRectangle(road, x, y))
}

function canPlayerStandAt(
  roads: Phaser.Geom.Rectangle[],
  x: number,
  y: number,
  playerRadius: number,
): boolean {
  const r = playerRadius

  // 使用上下左右四点采样近似圆形碰撞，性能稳定且便于维护。
  return (
    isPointOnRoad(roads, x - r, y) &&
    isPointOnRoad(roads, x + r, y) &&
    isPointOnRoad(roads, x, y - r) &&
    isPointOnRoad(roads, x, y + r)
  )
}

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

export function movePlayerByCursorsOnRoads(params: MovePlayerByCursorsParams): void {
  const { player, cursors, roads, moveSpeed, deltaMs, playerRadius } = params
  const step = moveSpeed * (deltaMs / 1000)
  const { vx, vy } = getMovementVectorFromCursors(cursors, step)

  if (vx === 0 && vy === 0) {
    return
  }

  const targetX = player.x + vx
  const targetY = player.y + vy

  // 分轴移动可降低贴墙转角时的阻塞感。
  if (canPlayerStandAt(roads, targetX, player.y, playerRadius)) {
    player.x = targetX
  }
  if (canPlayerStandAt(roads, player.x, targetY, playerRadius)) {
    player.y = targetY
  }
}
