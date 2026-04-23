/**
 * 世界地图 Phaser 场景定义
 *
 * 负责创建和管理 Phaser 游戏场景，包括：
 * - 道路网络的绘制与碰撞区域
 * - 地块的渲染与交互（靠近地块时显示信息、按空格查看详情）
 * - 玩家角色的创建、动画与移动
 * - 相机跟随玩家
 * - 通过事件机制与 React 层同步地图数据和玩家位置
 */
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

/** Phaser 模块类型，用于动态导入后传入 */
type PhaserModule = typeof import('phaser')

/** 创建世界地图场景时的配置选项 */
type WorldMapSceneOptions = {
  plots?: ReadonlyArray<WorldMapRenderablePlot>
  currentUserId?: string
  playerPosition?: PlayerPosition
  onPlayerPositionChange?: (position: PlayerPosition) => void
  onOpenExistingPlot?: (plotId: string) => void
  onSceneReady?: () => void
}

/** React 层向 Phaser 场景同步数据时使用的事件名称 */
export const WORLD_MAP_SYNC_EVENT = 'world-map:sync-data'

/** 同步地图数据的事件载荷类型 */
type SyncMapDataPayload = {
  plots: ReadonlyArray<WorldMapRenderablePlot>
  currentUserId?: string
  playerPosition?: PlayerPosition
}

/**
 * 工厂函数：创建世界地图 Phaser 场景类
 *
 * 采用闭包方式注入 Phaser 模块和外部回调选项，
 * 返回一个可直接传入 Phaser.Game 配置的 Scene 子类。
 */
export function createWorldMapScene(Phaser: PhaserModule, options: WorldMapSceneOptions = {}) {
  const { Scene, Geom } = Phaser
  const BACKGROUND_COLOR = '#71b35f'
  const ROAD_COLOR = 0x5f5f5f
  const LANE_MARK_COLOR = 0xeedc82
  const HORIZONTAL_ROAD_CENTERS = [MAP_HEIGHT / 2, MAP_HEIGHT / 4]
  const VERTICAL_ROAD_CENTERS_IN_MAP = VERTICAL_ROAD_CENTERS

  /** 世界地图场景主类，管理道路、地块、玩家和交互逻辑 */
  class WorldMapScene extends Scene {
    private roads: Phaser.Geom.Rectangle[] = []           // 道路碰撞矩形集合
    private plots: WorldMapPlot[] = []                     // 所有地块数据
    private plotRenderObjects: Phaser.GameObjects.GameObject[] = [] // 地块渲染对象，场景重建时需销毁
    private nearbyPlot: WorldMapPlot | null = null         // 当前玩家附近的地块
    private nearbyPlotText!: Phaser.GameObjects.Text       // 附近地块信息文本（HUD）
    private interactHintText!: Phaser.GameObjects.Text     // 交互提示文本（HUD）
    private interactKey!: Phaser.Input.Keyboard.Key        // 空格键（交互按键）
    private plotsData: ReadonlyArray<WorldMapRenderablePlot> = options.plots ?? []
    private currentUserId: string | undefined = options.currentUserId
    private playerPosition: PlayerPosition | undefined = options.playerPosition
    private hasAppliedPersistedPlayerPosition = false      // 是否已应用过服务端持久化的玩家位置
    private lastLocalMoveAt = 0                            // 上次本地移动的时间戳（用于防抖服务端纠偏）
    player!: PlayerSprite
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    moveSpeed = 220                                        // 玩家移动速度（像素/秒）

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


    /** 检测当前是否有 DOM 输入框获得焦点，用于避免键盘事件冲突 */
    private isDOMInputFocused(): boolean {
      const tag = document.activeElement?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }

    /** 每帧更新：处理玩家移动、动画和附近地块 UI */
    update(): void {
      // DOM 输入框聚焦时跳过键盘处理，避免与表单输入冲突
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

      const movedDistance = Math.hypot(this.player.x - prevX, this.player.y - prevY)

      updatePlayerAnimation(this.player, this.cursors, movedDistance > 0)
      if (prevX !== this.player.x || prevY !== this.player.y) {
        this.lastLocalMoveAt = this.time.now
        options.onPlayerPositionChange?.({
          x: this.player.x,
          y: this.player.y,
        })
      }
      this.updateNearbyPlotUI()
    }

    /** 创建道路网络：横向与纵向道路的绘制和碰撞区域 */
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

    /** 渲染所有地块，销毁旧渲染对象后重新生成 */
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

    /** 接收 React 层推送的最新地图数据，更新地块与玩家位置 */
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
        (
          !this.hasAppliedPersistedPlayerPosition ||
          shouldSnapToServerPosition(
            this.player,
            payload.playerPosition,
            this.time.now - this.lastLocalMoveAt
          )
        )
      ) {
        this.player.setPosition(payload.playerPosition.x, payload.playerPosition.y)
        this.hasAppliedPersistedPlayerPosition = true
      }
      this.renderPlots()
    }

    /** 更新附近地块的 HUD 提示文字，并监听空格键打开地块详情 */
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

/** 计算点到矩形的最短距离（点在矩形内则返回 0） */
function distancePointToRect(px: number, py: number, rect: Phaser.Geom.Rectangle): number {
  const closestX = clamp(px, rect.left, rect.right)
  const closestY = clamp(py, rect.top, rect.bottom)
  return Math.hypot(px - closestX, py - closestY)
}

/** 将数值限制在 [min, max] 范围内 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

/**
 * 判断是否应将玩家位置强制校正到服务端坐标
 *
 * 当本地最近有移动操作时不纠偏（避免卡顿），
 * 只有闲置一段时间后且偏移超过阈值才执行纠偏。
 */
function shouldSnapToServerPosition(
  current: PlayerPosition,
  next: PlayerPosition,
  elapsedSinceLocalMoveMs: number
): boolean {
  // 本地刚发生连续移动时，忽略服务端纠偏，避免“前进-回拉”的卡顿感。
  if (elapsedSinceLocalMoveMs < 1200) {
    return false
  }
  const maxDriftDistance = 24
  return Math.hypot(current.x - next.x, current.y - next.y) > maxDriftDistance
}
