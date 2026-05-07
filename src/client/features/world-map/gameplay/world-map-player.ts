/**
 * 世界地图玩家角色管理
 *
 * 负责玩家精灵的资源预加载、创建、动画定义和动画切换。
 * 使用 dude.png 精灵表，包含左行、右行和站立三组帧动画。
 */
import type * as Phaser from 'phaser'
import { MAP_HEIGHT } from '../constants'

const DUDE_TEXTURE_KEY = 'dude-move'                        // 玩家精灵纹理 key
const dudeUrl = new URL('../../../../../public/assets/dude-move.png', import.meta.url).href

/** 带物理体的玩家精灵类型 */
export type PlayerSprite = Phaser.GameObjects.Sprite & { body: Phaser.Physics.Arcade.Body }
/** 玩家位置坐标类型 */
export type PlayerPosition = { x: number; y: number }

/** 预加载玩家精灵表资源 */
export function preloadPlayerAssets(scene: Phaser.Scene): void {
  scene.load.spritesheet(DUDE_TEXTURE_KEY, dudeUrl, { frameWidth: 80, frameHeight: 120 })
}

/** 创建玩家精灵并放置到指定位置，默认位于地图左侧道路中央 */
export function createPlayer(
  scene: Phaser.Scene,
  position: PlayerPosition = { x: 140, y: MAP_HEIGHT / 2 },
): PlayerSprite {
  const player = scene.physics.add.sprite(position.x, position.y, DUDE_TEXTURE_KEY) as PlayerSprite
  player.setOrigin(0.5, 1)
  player.setFrame(0)
  player.setScale(0.5)
  player.setDepth(20)
  return player
}

/** 注册玩家动画（up / down / left / right / turn），重复调用时跳过已存在的动画 */
export function createPlayerAnimations(scene: Phaser.Scene): void {
  const { anims } = scene

  // 第1行：向下（帧 0-3）
  if (!anims.exists('down')) {
    anims.create({
      key: 'down',
      frames: anims.generateFrameNumbers(DUDE_TEXTURE_KEY, { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    })
  }

  // 第2行：向左（帧 4-7）
  if (!anims.exists('left')) {
    anims.create({
      key: 'left',
      frames: anims.generateFrameNumbers(DUDE_TEXTURE_KEY, { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1,
    })
  }

  // 第3行：向右（帧 8-11）
  if (!anims.exists('right')) {
    anims.create({
      key: 'right',
      frames: anims.generateFrameNumbers(DUDE_TEXTURE_KEY, { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1,
    })
  }

  // 第4行：向上（帧 12-15）
  if (!anims.exists('up')) {
    anims.create({
      key: 'up',
      frames: anims.generateFrameNumbers(DUDE_TEXTURE_KEY, { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1,
    })
  }

  // 待机：朝下站立（帧 0）
  if (!anims.exists('turn')) {
    anims.create({
      key: 'turn',
      frames: [{ key: DUDE_TEXTURE_KEY, frame: 0 }],
      frameRate: 20,
    })
  }
}

/** 根据方向键状态和移动标志更新玩家播放的动画 */
export function updatePlayerAnimation(
  player: PlayerSprite,
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  isMoving = true,
): void {
  if (!isMoving) {
    player.anims.play('turn', true)
    return
  }

  if (cursors.up.isDown) {
    player.anims.play('up', true)
    return
  }
  if (cursors.down.isDown) {
    player.anims.play('down', true)
    return
  }
  if (cursors.left.isDown) {
    player.anims.play('left', true)
    return
  }
  if (cursors.right.isDown) {
    player.anims.play('right', true)
    return
  }

  player.anims.play('turn', true)
}
