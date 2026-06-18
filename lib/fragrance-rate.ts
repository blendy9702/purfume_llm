export type FragranceRateValue =
  | 'Parfum'
  | 'Eau de Parfum'
  | 'Eau de Toilette'
  | 'Eau de Cologne'

export type FragranceRateConfig = {
  value: FragranceRateValue
  label: string
  sub: string
  min: number
  max: number
  defaultPercent: number
  agingGuide: string
}

export const FRAGRANCE_RATE_OPTIONS: FragranceRateConfig[] = [
  {
    value: 'Parfum',
    label: 'Parfum (향수)',
    sub: '30-45% — 가장 진하고 지속력 강함',
    min: 30,
    max: 45,
    defaultPercent: 38,
    agingGuide: '에탄올(90% 이상) 나머지 / 최소 4주 숙성 후 사용 권장',
  },
  {
    value: 'Eau de Parfum',
    label: 'Eau de Parfum (오드퍼퓸)',
    sub: '20-30% — 하루종일 지속',
    min: 20,
    max: 30,
    defaultPercent: 25,
    agingGuide: '에탄올(90% 이상) 나머지 / 최소 2주 숙성 후 사용 권장',
  },
  {
    value: 'Eau de Toilette',
    label: 'Eau de Toilette (오드뚜왈렛)',
    sub: '10-20% — 일상적 사용',
    min: 10,
    max: 20,
    defaultPercent: 15,
    agingGuide: '에탄올(85% 이상) 나머지 / 1-2주 숙성 후 사용 권장',
  },
  {
    value: 'Eau de Cologne',
    label: 'Eau de Cologne (오드콜로뉜)',
    sub: '3-10% — 가볍고 상쾌함',
    min: 3,
    max: 10,
    defaultPercent: 6,
    agingGuide: '에탄올(70% 이상) 나머지 / 1주 숙성 후 사용 권장',
  },
]

export const FRAGRANCE_RATE_MAP = Object.fromEntries(
  FRAGRANCE_RATE_OPTIONS.map((option) => [option.value, option])
) as Record<FragranceRateValue, FragranceRateConfig>

export function getFragranceRateConfig(rate: string): FragranceRateConfig | undefined {
  return FRAGRANCE_RATE_MAP[rate as FragranceRateValue]
}

export function clampFragrancePercent(rate: string, percent: number): number | null {
  const config = getFragranceRateConfig(rate)
  if (!config) return null
  const rounded = Math.round(percent)
  if (rounded < config.min || rounded > config.max) return null
  return rounded
}

export function getDefaultFragrancePercent(rate: string): number | null {
  return getFragranceRateConfig(rate)?.defaultPercent ?? null
}

export function getPercentOptions(rate: string): number[] {
  const config = getFragranceRateConfig(rate)
  if (!config) return []
  return Array.from({ length: config.max - config.min + 1 }, (_, i) => config.min + i)
}

export function formatFragranceRateLabel(rate: string, percent?: number | null): string {
  if (percent != null) return `${rate} · ${percent}%`
  return rate
}
