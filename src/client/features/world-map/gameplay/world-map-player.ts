import type * as Phaser from 'phaser'
import { MAP_HEIGHT } from '../constants'

const DUDE_TEXTURE_KEY = 'dude'
const dudeUrl = new URL('../../../../../public/assets/dude.png', import.meta.url).href

export type PlayerSprite = Phaser.GameObjects.Sprite & { body: Phaser.Physics.Arcade.Body }
export type PlayerPosition = { x: number; y: number }

export function preloadPlayerAssets(scene: Phaser.Scene): void {
  scene.load.spritesheet(DUDE_TEXTURE_KEY, dudeUrl, { frameWidth: 32, frameHeight: 48 })
}

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

export function updatePlayerAnimation(
  player: PlayerSprite,
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
): void {
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
