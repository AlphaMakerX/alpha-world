import { MAP_HEIGHT, MAP_WIDTH, PLOT_HEIGHT, PLOT_WIDTH, ROAD_WIDTH } from '../constants'
import type { BuildingType } from '@/client/features/building/types/building-ui'
import { drawBuildingByType, getBuildingVisualConfig } from './world-map-building'

export type WorldMapPlot = {
  id: string
  rect: Phaser.Geom.Rectangle
  isExistingPlot: boolean
  isHighlighted: boolean
  buildingType?: BuildingType
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
  buildingTypeByPlotId: ReadonlyMap<string, BuildingType>
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
    fontSize: '11px',
    color: '#ffffff',
    stroke: '#222222',
    strokeThickness: 3,
    fontStyle: 'bold',
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
    const buildingVisual = buildingType ? getBuildingVisualConfig(buildingType) : null
    const fillColor = isHighlighted
      ? 0xfde047
      : buildingVisual
        ? buildingVisual.plotFillColor
        : isExistingPlot
          ? 0xffffff
          : 0xe5e7eb
    const borderColor = isHighlighted
      ? 0xf59e0b
      : buildingVisual
        ? buildingVisual.plotBorderColor
        : 0xd1d5db
    plotGraphics.fillStyle(fillColor, 0.96)
    plotGraphics.fillRect(plotX, plotY, PLOT_WIDTH, PLOT_HEIGHT)
    plotGraphics.lineStyle(2, borderColor, 0.98)
    plotGraphics.strokeRect(plotX, plotY, PLOT_WIDTH, PLOT_HEIGHT)
    if (buildingType && buildingVisual) {
      drawBuildingByType(plotGraphics, plotX, plotY, buildingType)
      const badgeText = scene.add
        .text(plotX + PLOT_WIDTH / 2, plotY + 12, buildingVisual.label, {
          fontSize: '10px',
          fontStyle: 'bold',
          color: buildingVisual.badgeTextColor,
          backgroundColor: buildingVisual.badgeBackgroundColor,
          stroke: buildingVisual.badgeBorderColor,
          strokeThickness: 1,
          padding: { x: 4, y: 1 },
        })
        .setOrigin(0.5, 0)
        .setDepth(4)
      renderObjects.push(badgeText)
    }

    const plotText = scene.add
      .text(plotX + 6, plotY + PLOT_HEIGHT - 5, plotId, textStyle)
      .setOrigin(0, 1)
      .setDepth(3)
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

// 边界数组按“起点-终点”两两配对为区间。
function pairToSegments(boundaries: number[]): Array<{ start: number; end: number }> {
  const segments: Array<{ start: number; end: number }> = []
  for (let i = 0; i + 1 < boundaries.length; i += 2) {
    segments.push({ start: boundaries[i], end: boundaries[i + 1] })
  }
  return segments
}
