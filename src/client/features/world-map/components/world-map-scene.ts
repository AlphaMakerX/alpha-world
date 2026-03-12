import {
  CAMERA_LERP,
  INSPECT_DISTANCE,
  MAP_HEIGHT,
  MAP_WIDTH,
  PLAYER_RADIUS,
  ROAD_WIDTH,
  SCENE_KEY,
  VERTICAL_ROAD_CENTERS,
} from '../constants'
import { createPlotsAndRender } from './world-map-plot'
import { movePlayerByCursorsOnRoads } from './world-map-movement'
import {
  createPlayer,
  createPlayerAnimations,
  preloadPlayerAssets,
  type PlayerSprite,
  updatePlayerAnimation,
} from './world-map-player'
import type { WorldMapPlot } from './world-map-plot'

type PhaserModule = typeof import('phaser')

type WorldMapSceneOptions = {
  existingPlotIds?: ReadonlySet<string>
  onOpenExistingPlot?: (plotId: string) => void
}

export function createWorldMapScene(Phaser: PhaserModule, options: WorldMapSceneOptions = {}) {
  const { Scene, Geom } = Phaser
  const BACKGROUND_COLOR = '#71b35f'
  const ROAD_COLOR = 0x5f5f5f
  const LANE_MARK_COLOR = 0xeedc82

  class WorldMapScene extends Scene {
    private roads: Phaser.Geom.Rectangle[] = []
    private plots: WorldMapPlot[] = []
    private nearbyPlot: WorldMapPlot | null = null
    private nearbyPlotText!: Phaser.GameObjects.Text
    private interactHintText!: Phaser.GameObjects.Text
    private interactKey!: Phaser.Input.Keyboard.Key
    player!: PlayerSprite
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    moveSpeed = 220

    constructor() {
      super(SCENE_KEY)
    }
    preload() {
      preloadPlayerAssets(this)
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND_COLOR)
      this.createRoadNetwork()
      createPlayerAnimations(this)
      this.player = createPlayer(this)

      // 相机跟随玩家，地图尺寸由常量统一控制，便于后续扩展更大场景。
      this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
      this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP)
      const keyboard = this.input.keyboard
      if (!keyboard) {
        throw new Error('Keyboard input is not available')
      }
      this.cursors = keyboard.createCursorKeys()
      this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

      this.nearbyPlotText = this.add
        .text(16, 16, '', {
          fontSize: '16px',
          color: '#ffffff',
          stroke: '#111827',
          strokeThickness: 4,
        })
        .setDepth(10)
        .setScrollFactor(0)

      this.interactHintText = this.add
        .text(16, 40, '', {
          fontSize: '14px',
          color: '#fde68a',
          stroke: '#111827',
          strokeThickness: 4,
        })
        .setDepth(10)
        .setScrollFactor(0)
    }


    update(): void {
      movePlayerByCursorsOnRoads({
        player: this.player,
        cursors: this.cursors,
        roads: this.roads,
        moveSpeed: this.moveSpeed,
        deltaMs: this.game.loop.delta,
        playerRadius: PLAYER_RADIUS,
      })

      updatePlayerAnimation(this.player, this.cursors)
      this.updateNearbyPlotUI()
    }

    private createRoadNetwork(): void {
      const graphics = this.add.graphics()
      const horizontalRoads = [MAP_HEIGHT / 2, MAP_HEIGHT / 4]
      const verticalRoads = VERTICAL_ROAD_CENTERS

      this.roads = []

      // 先构建道路碰撞几何，绘制与碰撞共享同一份数据。
      horizontalRoads.forEach((yCenter) => {
        this.roads.push(new Geom.Rectangle(0, yCenter - ROAD_WIDTH / 2, MAP_WIDTH, ROAD_WIDTH))
      })

      verticalRoads.forEach((xCenter) => {
        this.roads.push(new Geom.Rectangle(xCenter - ROAD_WIDTH / 2, 0, ROAD_WIDTH, MAP_HEIGHT))
      })

      graphics.fillStyle(ROAD_COLOR, 1)
      this.roads.forEach((road) => {
        graphics.fillRect(road.x, road.y, road.width, road.height)
      })

      // 车道线仅用于视觉引导，不参与碰撞判定。
      graphics.lineStyle(3, LANE_MARK_COLOR, 0.75)
      horizontalRoads.forEach((yCenter) => {
        graphics.lineBetween(0, yCenter, MAP_WIDTH, yCenter)
      })
      verticalRoads.forEach((xCenter) => {
        graphics.lineBetween(xCenter, 0, xCenter, MAP_HEIGHT)
      })

      this.plots = createPlotsAndRender(
        this,
        this.roads,
        horizontalRoads,
        verticalRoads,
        options.existingPlotIds ?? new Set<string>()
      )
    }

    private updateNearbyPlotUI(): void {
      const playerX = this.player.x
      const playerY = this.player.y

      let nearestPlot: WorldMapPlot | null = null
      let minDistance = Number.POSITIVE_INFINITY

      for (const plot of this.plots) {
        const distance = distancePointToRect(playerX, playerY, plot.rect)
        if (distance < minDistance) {
          minDistance = distance
          nearestPlot = plot
        }
      }

      if (!nearestPlot || minDistance > INSPECT_DISTANCE) {
        this.nearbyPlot = null
        this.nearbyPlotText.setText('')
        this.interactHintText.setText('')
        return
      }

      this.nearbyPlot = nearestPlot
      this.nearbyPlotText.setText(`地块: ${nearestPlot.id}`)
      this.interactHintText.setText(
        nearestPlot.isExistingPlot ? '按空格查看详情' : '该地块暂无详情'
      )

      if (nearestPlot.isExistingPlot && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        options.onOpenExistingPlot?.(nearestPlot.id)
      }
    }

  }

  return WorldMapScene
}

function distancePointToRect(px: number, py: number, rect: Phaser.Geom.Rectangle): number {
  const closestX = clamp(px, rect.left, rect.right)
  const closestY = clamp(py, rect.top, rect.bottom)
  return Math.hypot(px - closestX, py - closestY)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}
