/**
 * 世界地图玩家角色管理
 *
 * 负责玩家精灵的资源预加载、创建、动画定义和动画切换。
 * 使用 dude.png 精灵表，包含左行、右行和站立三组帧动画。
 */
import type * as Phaser from 'phaser'
import { MAP_HEIGHT } from '../constants'

const DUDE_TEXTURE_KEY = 'dude'                            // 玩家精灵纹理 key
const dudeUrl = new URL('../../../../../public/assets/dude.png', import.meta.url).href

/** 带物理体的玩家精灵类型 */
export type PlayerSprite = Phaser.GameObjects.Sprite & { body: Phaser.Physics.Arcade.Body }
/** 玩家位置坐标类型 */
export type PlayerPosition = { x: number; y: number }

/** 预加载玩家精灵表资源 */
export function preloadPlayerAssets(scene: Phaser.Scene): void {
  scene.load.spritesheet(DUDE_TEXTURE_KEY, dudeUrl, { frameWidth: 32, frameHeight: 48 })
}

/** 创建玩家精灵并放置到指定位置，默认位于地图左侧道路中央 */
export function createPlayer(
  scene: Phaser.Scene,
  position: PlayerPosition = { x: 140, y: MAP_HEIGHT / 2 },
): PlayerSprite {
  const player = scene.physics.add.sprite(position.x, position.y, DUDE_TEXTURE_KEY) as PlayerSprite
  player.setOrigin(0.5, 1)
  player.setFrame(4)
  player.setDepth(20)
  return player
}

/** 注册玩家动画（left / turn / right），重复调用时跳过已存在的动画 */
export function createPlayerAnimations(scene: Phaser.Scene): void {
  const { anims } = scene

  if (!anims.exists('left')) {
    anims.create({
      key: 'left',
      frames: anims.generateFrameNumbers(DUDE_TEXTURE_KEY, { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    })
  }

  if (!anims.exists('turn')) {
    anims.create({
      key: 'turn',
      frames: [{ key: DUDE_TEXTURE_KEY, frame: 4 }],
      frameRate: 20,
    })
  }

  if (!anims.exists('right')) {
    anims.create({
      key: 'right',
      frames: anims.generateFrameNumbers(DUDE_TEXTURE_KEY, { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
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
