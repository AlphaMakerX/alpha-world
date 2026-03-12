import { MAP_HEIGHT, MAP_WIDTH, PLOT_HEIGHT, PLOT_WIDTH, ROAD_WIDTH } from '../constants'

export type PlotBuildingType = 'residential' | 'factory' | 'shop'

export type WorldMapPlot = {
  id: string
  rect: Phaser.Geom.Rectangle
  isExistingPlot: boolean
  isHighlighted: boolean
  buildingType?: PlotBuildingType
}

export type PlotRenderResult = {
  plots: WorldMapPlot[]
  renderObjects: Phaser.GameObjects.GameObject[]
}

// 在道路两侧生成地块，绘制地块与地块 id（P{row}-{col}）。
export function createPlotsAndRender(
  scene: Phaser.Scene,
  roads: Phaser.Geom.Rectangle[],
  horizontalRoadCenters: number[],
  verticalRoadCenters: number[],
  existingPlotIds: ReadonlySet<string>,
  highlightedPlotIds: ReadonlySet<string>,
  buildingTypeByPlotId: ReadonlyMap<string, PlotBuildingType>
): PlotRenderResult {
  const plotGraphics = scene.add.graphics()
  const renderObjects: Phaser.GameObjects.GameObject[] = [plotGraphics]
  const sideMargin = 28
  const plotGap = 12
  const plotOffsetY = 18
  const plotOffsetX = 18
  const roadHalf = ROAD_WIDTH / 2

  // 横向道路的上下两侧：每条路对应两排地块。
  const rowYPositions = horizontalRoadCenters
    .flatMap((roadCenterY) => {
      const roadTop = roadCenterY - roadHalf
      const roadBottom = roadCenterY + roadHalf
      return [roadTop - PLOT_HEIGHT - plotOffsetY, roadBottom + plotOffsetY]
    })
    .filter((y) => y >= 0 && y + PLOT_HEIGHT <= MAP_HEIGHT)

  const xBoundaries = [
    0,
    ...verticalRoadCenters.map((x) => x - roadHalf),
    ...verticalRoadCenters.map((x) => x + roadHalf),
    MAP_WIDTH,
  ].sort((a, b) => a - b)
  const xSegments = pairToSegments(xBoundaries)

  const colXPositions = verticalRoadCenters
    .flatMap((roadCenterX) => {
      const roadLeft = roadCenterX - roadHalf
      const roadRight = roadCenterX + roadHalf
      return [roadLeft - PLOT_WIDTH - plotOffsetX, roadRight + plotOffsetX]
    })
    .filter((x) => x >= 0 && x + PLOT_WIDTH <= MAP_WIDTH)

  // 纵向道路会把地图切成多个可放置区间，地块只在区间内排布。
  const yBoundaries = [
    0,
    ...horizontalRoadCenters.map((y) => y - roadHalf),
    ...horizontalRoadCenters.map((y) => y + roadHalf),
    MAP_HEIGHT,
  ].sort((a, b) => a - b)
  const ySegments = pairToSegments(yBoundaries)

  const occupiedPlotRects: Phaser.Geom.Rectangle[] = []
  const plots: WorldMapPlot[] = []
  const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontSize: '14px',
    color: '#ffffff',
    stroke: '#222222',
    strokeThickness: 3,
  }

  const placePlot = (plotX: number, plotY: number, row: number, col: number): void => {
    const plotRect = new Phaser.Geom.Rectangle(plotX, plotY, PLOT_WIDTH, PLOT_HEIGHT)
    const overlapRoad = roads.some((road) => Phaser.Geom.Intersects.RectangleToRectangle(plotRect, road))
    if (overlapRoad) {
      return
    }
    const overlapOtherPlot = occupiedPlotRects.some((existingRect) =>
      Phaser.Geom.Intersects.RectangleToRectangle(plotRect, existingRect)
    )
    if (overlapOtherPlot) {
      return
    }

    // 使用固定格式的地块 id，方便后续定位与交互。
    const plotId = `P${row}-${String(col).padStart(2, '0')}`
    occupiedPlotRects.push(plotRect)
    const isExistingPlot = existingPlotIds.has(plotId)
    const isHighlighted = highlightedPlotIds.has(plotId)
    const buildingType = buildingTypeByPlotId.get(plotId)
    plots.push({
      id: plotId,
      rect: plotRect,
      isExistingPlot,
      isHighlighted,
      buildingType,
    })
    const fillColor = isHighlighted
      ? 0xfde047
      : buildingType
        ? 0xfef3c7
        : isExistingPlot
          ? 0xffffff
          : 0xe5e7eb
    plotGraphics.fillStyle(fillColor, 0.95)
    plotGraphics.fillRect(plotX, plotY, PLOT_WIDTH, PLOT_HEIGHT)
    plotGraphics.lineStyle(2, 0xd1d5db, 0.95)
    plotGraphics.strokeRect(plotX, plotY, PLOT_WIDTH, PLOT_HEIGHT)
    if (buildingType) {
      drawBuildingByType(plotGraphics, plotX, plotY, buildingType)
    }

    const plotText = scene.add
      .text(plotX + PLOT_WIDTH / 2, plotY + PLOT_HEIGHT / 2, plotId, textStyle)
      .setOrigin(0.5)
      .setDepth(2)
    renderObjects.push(plotText)
  }

  // 先沿横向道路两侧铺地块（按行编号）。
  for (let rowIndex = 0; rowIndex < rowYPositions.length; rowIndex += 1) {
    const rowNumber = rowIndex + 1
    let colInRow = 1
    for (const segment of xSegments) {
      const segmentInnerWidth = segment.end - segment.start - sideMargin * 2
      if (segmentInnerWidth <= 0) {
        continue
      }
      const segmentCols = Math.max(1, Math.floor((segmentInnerWidth + plotGap) / (PLOT_WIDTH + plotGap)))
      const rowContentWidth = segmentCols * PLOT_WIDTH + (segmentCols - 1) * plotGap
      const startX = segment.start + sideMargin + (segmentInnerWidth - rowContentWidth) / 2

      for (let i = 0; i < segmentCols; i += 1) {
        const plotX = startX + i * (PLOT_WIDTH + plotGap)
        const plotY = rowYPositions[rowIndex]
        placePlot(plotX, plotY, rowNumber, colInRow)
        colInRow += 1
      }
    }
  }

  // 再沿纵向道路两侧铺地块（延续行编号）。
  for (let colIndex = 0; colIndex < colXPositions.length; colIndex += 1) {
    const rowNumber = rowYPositions.length + colIndex + 1
    const plotX = colXPositions[colIndex]
    let colInRow = 1
    for (const segment of ySegments) {
      const segmentInnerHeight = segment.end - segment.start - sideMargin * 2
      if (segmentInnerHeight <= 0) {
        continue
      }
      const segmentRows = Math.max(1, Math.floor((segmentInnerHeight + plotGap) / (PLOT_HEIGHT + plotGap)))
      const colContentHeight = segmentRows * PLOT_HEIGHT + (segmentRows - 1) * plotGap
      const startY = segment.start + sideMargin + (segmentInnerHeight - colContentHeight) / 2

      for (let i = 0; i < segmentRows; i += 1) {
        const plotY = startY + i * (PLOT_HEIGHT + plotGap)
        placePlot(plotX, plotY, rowNumber, colInRow)
        colInRow += 1
      }
    }
  }

  return { plots, renderObjects }
}

function drawBuildingByType(
  graphics: Phaser.GameObjects.Graphics,
  plotX: number,
  plotY: number,
  buildingType: PlotBuildingType
): void {
  if (buildingType === 'residential') {
    drawResidentialBuilding(graphics, plotX, plotY)
    return
  }
  if (buildingType === 'factory') {
    drawFactoryBuilding(graphics, plotX, plotY)
    return
  }
  drawShopBuilding(graphics, plotX, plotY)
}

function drawResidentialBuilding(
  graphics: Phaser.GameObjects.Graphics,
  plotX: number,
  plotY: number
): void {
  const bodyWidth = PLOT_WIDTH * 0.45
  const bodyHeight = PLOT_HEIGHT * 0.34
  const bodyX = plotX + (PLOT_WIDTH - bodyWidth) / 2
  const bodyY = plotY + PLOT_HEIGHT * 0.50
  const roofTopY = plotY + PLOT_HEIGHT * 0.24

  graphics.fillStyle(0x7dd3fc, 1)
  graphics.fillRect(bodyX, bodyY, bodyWidth, bodyHeight)
  graphics.lineStyle(2, 0x075985, 0.9)
  graphics.strokeRect(bodyX, bodyY, bodyWidth, bodyHeight)

  graphics.fillStyle(0xef4444, 1)
  graphics.fillTriangle(
    bodyX - 3,
    bodyY,
    bodyX + bodyWidth + 3,
    bodyY,
    bodyX + bodyWidth / 2,
    roofTopY
  )
}

function drawFactoryBuilding(
  graphics: Phaser.GameObjects.Graphics,
  plotX: number,
  plotY: number
): void {
  const baseWidth = PLOT_WIDTH * 0.56
  const baseHeight = PLOT_HEIGHT * 0.32
  const baseX = plotX + (PLOT_WIDTH - baseWidth) / 2
  const baseY = plotY + PLOT_HEIGHT * 0.52
  const chimneyWidth = PLOT_WIDTH * 0.12
  const chimneyHeight = PLOT_HEIGHT * 0.28
  const chimneyX = baseX + baseWidth - chimneyWidth - 4
  const chimneyY = baseY - chimneyHeight + 2

  graphics.fillStyle(0x9ca3af, 1)
  graphics.fillRect(baseX, baseY, baseWidth, baseHeight)
  graphics.fillStyle(0x6b7280, 1)
  graphics.fillRect(chimneyX, chimneyY, chimneyWidth, chimneyHeight)
  graphics.lineStyle(2, 0x374151, 0.95)
  graphics.strokeRect(baseX, baseY, baseWidth, baseHeight)
  graphics.strokeRect(chimneyX, chimneyY, chimneyWidth, chimneyHeight)
}

function drawShopBuilding(
  graphics: Phaser.GameObjects.Graphics,
  plotX: number,
  plotY: number
): void {
  const baseWidth = PLOT_WIDTH * 0.52
  const baseHeight = PLOT_HEIGHT * 0.30
  const baseX = plotX + (PLOT_WIDTH - baseWidth) / 2
  const baseY = plotY + PLOT_HEIGHT * 0.54
  const awningHeight = PLOT_HEIGHT * 0.10
  const awningY = baseY - awningHeight
  const stripeWidth = baseWidth / 4

  graphics.fillStyle(0xf59e0b, 1)
  graphics.fillRect(baseX, baseY, baseWidth, baseHeight)
  graphics.lineStyle(2, 0x92400e, 0.95)
  graphics.strokeRect(baseX, baseY, baseWidth, baseHeight)

  for (let i = 0; i < 4; i += 1) {
    const stripeX = baseX + stripeWidth * i
    graphics.fillStyle(i % 2 === 0 ? 0xffffff : 0xfb923c, 1)
    graphics.fillRect(stripeX, awningY, stripeWidth, awningHeight)
  }
  graphics.lineStyle(1.5, 0x9a3412, 0.9)
  graphics.strokeRect(baseX, awningY, baseWidth, awningHeight)
}

// 边界数组按“起点-终点”两两配对为区间。
function pairToSegments(boundaries: number[]): Array<{ start: number; end: number }> {
  const segments: Array<{ start: number; end: number }> = []
  for (let i = 0; i + 1 < boundaries.length; i += 2) {
    segments.push({ start: boundaries[i], end: boundaries[i + 1] })
  }
  return segments
}
