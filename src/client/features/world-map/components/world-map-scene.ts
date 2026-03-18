import {
  CAMERA_LERP,
  INSPECT_DISTANCE,
  MAP_HEIGHT,
  MAP_WIDTH,
  PLAYER_FOOT_OFFSET_Y,
  PLAYER_RADIUS,
  ROAD_WIDTH,
  SCENE_KEY,
  VERTICAL_ROAD_CENTERS,
} from '../constants'
import { createPlotsAndRender } from '../rendering/world-map-plot'
import { movePlayerByCursorsOnRoads } from '../gameplay/world-map-movement'
import {
  createPlayer,
  createPlayerAnimations,
  preloadPlayerAssets,
  type PlayerPosition,
  type PlayerSprite,
  updatePlayerAnimation,
} from '../gameplay/world-map-player'
import type { BuildingType } from '@/client/features/building/types/building-ui'
import type { PlotRenderResult, WorldMapPlot, WorldMapRenderablePlot } from '../rendering/world-map-plot'

type PhaserModule = typeof import('phaser')

type WorldMapSceneOptions = {
  plots?: ReadonlyArray<WorldMapRenderablePlot>
  currentUserId?: string
  playerPosition?: PlayerPosition
  onPlayerPositionChange?: (position: PlayerPosition) => void
  onOpenExistingPlot?: (plotId: string) => void
  onSceneReady?: () => void
}

export const WORLD_MAP_SYNC_EVENT = 'world-map:sync-data'

type SyncMapDataPayload = {
  plots: ReadonlyArray<WorldMapRenderablePlot>
  currentUserId?: string
  playerPosition?: PlayerPosition
}

export function createWorldMapScene(Phaser: PhaserModule, options: WorldMapSceneOptions = {}) {
  const { Scene, Geom } = Phaser
  const BACKGROUND_COLOR = '#71b35f'
  const ROAD_COLOR = 0x5f5f5f
  const LANE_MARK_COLOR = 0xeedc82
  const HORIZONTAL_ROAD_CENTERS = [MAP_HEIGHT / 2, MAP_HEIGHT / 4]
  const VERTICAL_ROAD_CENTERS_IN_MAP = VERTICAL_ROAD_CENTERS

  class WorldMapScene extends Scene {
    private roads: Phaser.Geom.Rectangle[] = []
    private plots: WorldMapPlot[] = []
    private plotRenderObjects: Phaser.GameObjects.GameObject[] = []
    private nearbyPlot: WorldMapPlot | null = null
    private nearbyPlotText!: Phaser.GameObjects.Text
    private interactHintText!: Phaser.GameObjects.Text
    private interactKey!: Phaser.Input.Keyboard.Key
    private plotsData: ReadonlyArray<WorldMapRenderablePlot> = options.plots ?? []
    private currentUserId: string | undefined = options.currentUserId
    private playerPosition: PlayerPosition | undefined = options.playerPosition
    private hasAppliedPersistedPlayerPosition = false
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
      this.renderPlots()
      createPlayerAnimations(this)
      this.player = createPlayer(this, this.playerPosition)

      // 相机跟随玩家，地图尺寸由常量统一控制，便于后续扩展更大场景。
      this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
      this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP)
      const keyboard = this.input.keyboard
      if (!keyboard) {
        throw new Error('Keyboard input is not available')
      }
      this.cursors = keyboard.createCursorKeys()
      this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      // 禁止全局捕获键盘事件 解决与antd输入框冲突问题
      keyboard.disableGlobalCapture()

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

      this.game.events.on(
        WORLD_MAP_SYNC_EVENT,
        this.syncMapData,
        this
      )
      options.onSceneReady?.()
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.game.events.off(
          WORLD_MAP_SYNC_EVENT,
          this.syncMapData,
          this
        )
        this.plotRenderObjects.forEach((object) => {
          object.destroy()
        })
        this.plotRenderObjects = []
      })
    }


    private isDOMInputFocused(): boolean {
      const tag = document.activeElement?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }

    update(): void {
      if (this.isDOMInputFocused()) return
      const prevX = this.player.x
      const prevY = this.player.y

      movePlayerByCursorsOnRoads({
        player: this.player,
        cursors: this.cursors,
        roads: this.roads,
        moveSpeed: this.moveSpeed,
        deltaMs: this.game.loop.delta,
        playerRadius: PLAYER_RADIUS,
        playerFootOffsetY: PLAYER_FOOT_OFFSET_Y,
      })

      updatePlayerAnimation(this.player, this.cursors)
      if (prevX !== this.player.x || prevY !== this.player.y) {
        options.onPlayerPositionChange?.({
          x: this.player.x,
          y: this.player.y,
        })
      }
      this.updateNearbyPlotUI()
    }

    private createRoadNetwork(): void {
      const graphics = this.add.graphics()

      this.roads = []

      // 先构建道路碰撞几何，绘制与碰撞共享同一份数据。
      HORIZONTAL_ROAD_CENTERS.forEach((yCenter) => {
        this.roads.push(new Geom.Rectangle(0, yCenter - ROAD_WIDTH / 2, MAP_WIDTH, ROAD_WIDTH))
      })

      VERTICAL_ROAD_CENTERS_IN_MAP.forEach((xCenter) => {
        this.roads.push(new Geom.Rectangle(xCenter - ROAD_WIDTH / 2, 0, ROAD_WIDTH, MAP_HEIGHT))
      })

      graphics.fillStyle(ROAD_COLOR, 1)
      this.roads.forEach((road) => {
        graphics.fillRect(road.x, road.y, road.width, road.height)
      })

      // 车道线仅用于视觉引导，不参与碰撞判定。
      graphics.lineStyle(3, LANE_MARK_COLOR, 0.75)
      HORIZONTAL_ROAD_CENTERS.forEach((yCenter) => {
        graphics.lineBetween(0, yCenter, MAP_WIDTH, yCenter)
      })
      VERTICAL_ROAD_CENTERS_IN_MAP.forEach((xCenter) => {
        graphics.lineBetween(xCenter, 0, xCenter, MAP_HEIGHT)
      })
    }

    private renderPlots(): void {
      this.plotRenderObjects.forEach((object) => {
        object.destroy()
      })
      this.plotRenderObjects = []

      const renderResult: PlotRenderResult = createPlotsAndRender(
        this,
        this.roads,
        HORIZONTAL_ROAD_CENTERS,
        VERTICAL_ROAD_CENTERS_IN_MAP,
        this.plotsData,
        this.currentUserId
      )
      this.plots = renderResult.plots
      this.plotRenderObjects = renderResult.renderObjects
    }

    private syncMapData(payload: SyncMapDataPayload): void {
      this.plotsData = payload.plots
      this.playerPosition = payload.playerPosition
      const switchedAccount =
        payload.currentUserId !== this.currentUserId ||
        (payload.currentUserId === undefined && this.currentUserId !== undefined)
      this.currentUserId = payload.currentUserId
      if (switchedAccount) {
        this.hasAppliedPersistedPlayerPosition = false
      }
      if (
        payload.currentUserId &&
        payload.playerPosition &&
        !this.hasAppliedPersistedPlayerPosition
      ) {
        this.player.setPosition(payload.playerPosition.x, payload.playerPosition.y)
        this.hasAppliedPersistedPlayerPosition = true
      }
      this.renderPlots()
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
      const buildingLabelByType: Record<BuildingType, string> = {
        residential: '住宅',
        factory: '工厂',
        shop: '商店',
        purchasing_station: '收购站',
      }
      const buildingLabel = nearestPlot.buildingType
        ? `，建筑: ${buildingLabelByType[nearestPlot.buildingType]}`
        : ''
      this.nearbyPlotText.setText(`地块: ${nearestPlot.id}${buildingLabel}`)
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
