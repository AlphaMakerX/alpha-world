import { PLOT_HEIGHT, PLOT_WIDTH } from '../constants'
import type { BuildingType } from '@/client/features/building/types/building-ui'

export type BuildingVisualConfig = {
  label: string
  plotFillColor: number
  plotBorderColor: number
  badgeBackgroundColor: string
  badgeBorderColor: string
  badgeTextColor: string
}

const BUILDING_VISUAL_CONFIG: Record<BuildingType, BuildingVisualConfig> = {
  residential: {
    label: '住宅',
    plotFillColor: 0xdbeafe,
    plotBorderColor: 0x2563eb,
    badgeBackgroundColor: '#dbeafe',
    badgeBorderColor: '#1d4ed8',
    badgeTextColor: '#1e3a8a',
  },
  factory: {
    label: '工厂',
    plotFillColor: 0xe5e7eb,
    plotBorderColor: 0x374151,
    badgeBackgroundColor: '#e5e7eb',
    badgeBorderColor: '#374151',
    badgeTextColor: '#111827',
  },
  shop: {
    label: '商店',
    plotFillColor: 0xffedd5,
    plotBorderColor: 0xc2410c,
    badgeBackgroundColor: '#ffedd5',
    badgeBorderColor: '#c2410c',
    badgeTextColor: '#7c2d12',
  },
}

export function getBuildingVisualConfig(buildingType: BuildingType): BuildingVisualConfig {
  return BUILDING_VISUAL_CONFIG[buildingType]
}

export function drawBuildingByType(
  graphics: Phaser.GameObjects.Graphics,
  plotX: number,
  plotY: number,
  buildingType: BuildingType
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
  const bodyWidth = PLOT_WIDTH * 0.44
  const bodyHeight = PLOT_HEIGHT * 0.30
  const bodyX = plotX + (PLOT_WIDTH - bodyWidth) / 2
  const bodyY = plotY + PLOT_HEIGHT * 0.48
  const roofTopY = plotY + PLOT_HEIGHT * 0.22

  graphics.fillStyle(0xffffff, 1)
  graphics.fillRect(bodyX, bodyY, bodyWidth, bodyHeight)
  graphics.lineStyle(2, 0x1d4ed8, 1)
  graphics.strokeRect(bodyX, bodyY, bodyWidth, bodyHeight)

  graphics.fillStyle(0xef4444, 1)
  graphics.fillTriangle(bodyX - 3, bodyY, bodyX + bodyWidth + 3, bodyY, bodyX + bodyWidth / 2, roofTopY)

  const doorWidth = bodyWidth * 0.18
  const doorHeight = bodyHeight * 0.42
  const doorX = bodyX + (bodyWidth - doorWidth) / 2
  const doorY = bodyY + bodyHeight - doorHeight
  graphics.fillStyle(0x2563eb, 1)
  graphics.fillRect(doorX, doorY, doorWidth, doorHeight)

  const windowSize = Math.min(bodyWidth * 0.16, bodyHeight * 0.22)
  graphics.fillStyle(0x93c5fd, 1)
  graphics.fillRect(bodyX + bodyWidth * 0.18, bodyY + bodyHeight * 0.24, windowSize, windowSize)
  graphics.fillRect(
    bodyX + bodyWidth - bodyWidth * 0.18 - windowSize,
    bodyY + bodyHeight * 0.24,
    windowSize,
    windowSize
  )
}

function drawFactoryBuilding(
  graphics: Phaser.GameObjects.Graphics,
  plotX: number,
  plotY: number
): void {
  const baseWidth = PLOT_WIDTH * 0.58
  const baseHeight = PLOT_HEIGHT * 0.30
  const baseX = plotX + (PLOT_WIDTH - baseWidth) / 2
  const baseY = plotY + PLOT_HEIGHT * 0.52
  const chimneyWidth = PLOT_WIDTH * 0.11
  const chimneyHeight = PLOT_HEIGHT * 0.30
  const chimneyX = baseX + baseWidth - chimneyWidth - 5
  const chimneyY = baseY - chimneyHeight + 1

  graphics.fillStyle(0x9ca3af, 1)
  graphics.fillRect(baseX, baseY, baseWidth, baseHeight)
  graphics.fillStyle(0x4b5563, 1)
  graphics.fillRect(chimneyX, chimneyY, chimneyWidth, chimneyHeight)
  graphics.lineStyle(2, 0x374151, 0.95)
  graphics.strokeRect(baseX, baseY, baseWidth, baseHeight)
  graphics.strokeRect(chimneyX, chimneyY, chimneyWidth, chimneyHeight)

  const toothWidth = baseWidth / 3
  const toothTop = baseY - PLOT_HEIGHT * 0.10
  graphics.fillStyle(0x6b7280, 1)
  for (let i = 0; i < 3; i += 1) {
    const left = baseX + toothWidth * i
    const right = left + toothWidth
    const peak = left + toothWidth * 0.58
    graphics.fillTriangle(left, baseY, right, baseY, peak, toothTop)
  }

  graphics.fillStyle(0xd1d5db, 0.9)
  graphics.fillCircle(chimneyX + chimneyWidth + 4, chimneyY + 3, 3)
  graphics.fillCircle(chimneyX + chimneyWidth + 10, chimneyY - 1, 2.6)
}

function drawShopBuilding(
  graphics: Phaser.GameObjects.Graphics,
  plotX: number,
  plotY: number
): void {
  const baseWidth = PLOT_WIDTH * 0.54
  const baseHeight = PLOT_HEIGHT * 0.28
  const baseX = plotX + (PLOT_WIDTH - baseWidth) / 2
  const baseY = plotY + PLOT_HEIGHT * 0.56
  const awningHeight = PLOT_HEIGHT * 0.11
  const awningY = baseY - awningHeight
  const stripeWidth = baseWidth / 5

  graphics.fillStyle(0xfdba74, 1)
  graphics.fillRect(baseX, baseY, baseWidth, baseHeight)
  graphics.lineStyle(2, 0x9a3412, 1)
  graphics.strokeRect(baseX, baseY, baseWidth, baseHeight)

  for (let i = 0; i < 5; i += 1) {
    const stripeX = baseX + stripeWidth * i
    graphics.fillStyle(i % 2 === 0 ? 0xffffff : 0xef4444, 1)
    graphics.fillRect(stripeX, awningY, stripeWidth, awningHeight)
  }
  graphics.lineStyle(1.5, 0x9a3412, 0.9)
  graphics.strokeRect(baseX, awningY, baseWidth, awningHeight)

  const signWidth = baseWidth * 0.38
  const signHeight = PLOT_HEIGHT * 0.07
  const signX = baseX + (baseWidth - signWidth) / 2
  const signY = awningY - signHeight - 2
  graphics.fillStyle(0xb45309, 1)
  graphics.fillRect(signX, signY, signWidth, signHeight)
  graphics.lineStyle(1.2, 0x7c2d12, 1)
  graphics.strokeRect(signX, signY, signWidth, signHeight)
}
