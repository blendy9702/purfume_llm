/** 에센셜/프래그런스 오일 1ml ≈ 20방울 (표준 드로퍼 기준) */
export const DROPS_PER_ML = 20

/** ml 표시 — 불필요한 0 제거, 최대 3자리 소수 */
export function formatMl(ml: number): string {
  if (ml <= 0) return '0'
  if (ml < 0.001) return '<0.001'
  const fixed = ml.toFixed(3)
  return fixed.replace(/\.?0+$/, '') || '0'
}

function buildDropsLabel(ratio: number, rawDrops: number): string {
  if (ratio <= 0) return '0'
  if (rawDrops < 1) return '<1'
  return String(Math.round(rawDrops))
}

/** @deprecated midpoint fallback — prefer fragrancePercent */
const FRAGRANCE_OIL_FRACTION: Record<string, number> = {
  Parfum: 0.375,
  'Eau de Parfum': 0.25,
  'Eau de Toilette': 0.15,
  'Eau de Cologne': 0.065,
}

export function getOilFraction(fragranceRate: string, fragrancePercent?: number | null): number {
  if (fragrancePercent != null) return fragrancePercent / 100
  return FRAGRANCE_OIL_FRACTION[fragranceRate] ?? 0.15
}

export function calcIngredientDosage(
  ratio: number,
  volumeMl: number,
  fragranceRate: string,
  fragrancePercent?: number | null
): { ml: number; drops: number; dropsLabel: string } {
  const totalOilMl = volumeMl * getOilFraction(fragranceRate, fragrancePercent)
  const ingredientMl = totalOilMl * (ratio / 100)
  const rawDrops = ingredientMl * DROPS_PER_ML

  return {
    ml: ingredientMl,
    drops: Math.round(rawDrops),
    dropsLabel: buildDropsLabel(ratio, rawDrops),
  }
}

export function calcTotalDosage(
  notes: { ratio: number }[],
  volumeMl: number,
  fragranceRate: string,
  fragrancePercent?: number | null
): { totalMl: number; totalDrops: number } {
  const totalRatio = notes.reduce((sum, n) => sum + n.ratio, 0)
  const { ml, drops } = calcIngredientDosage(totalRatio, volumeMl, fragranceRate, fragrancePercent)
  return { totalMl: ml, totalDrops: drops }
}

/** 첨가제(DPG 등) — 전체 용량 대비 ratio% */
export function calcAdditiveMl(ratioPercentOfTotal: number, volumeMl: number): number {
  return volumeMl * (ratioPercentOfTotal / 100)
}

export function calcAdditiveDosage(
  ratioPercentOfTotal: number,
  volumeMl: number
): { ml: number; drops: number; dropsLabel: string } {
  const ml = calcAdditiveMl(ratioPercentOfTotal, volumeMl)
  const rawDrops = ml * DROPS_PER_ML
  return {
    ml,
    drops: Math.round(rawDrops),
    dropsLabel: buildDropsLabel(ratioPercentOfTotal, rawDrops),
  }
}

export function calcOilVolumeMl(
  volumeMl: number,
  fragranceRate: string,
  fragrancePercent?: number | null
): number {
  return volumeMl * getOilFraction(fragranceRate, fragrancePercent)
}

/** 에탄올 = 전체 − 원료 오일 − 첨가제 */
export function calcEthanolVolumeMl(
  volumeMl: number,
  fragranceRate: string,
  fragrancePercent?: number | null,
  additivePercentOfTotal: number = 0
): number {
  const oilMl = calcOilVolumeMl(volumeMl, fragranceRate, fragrancePercent)
  const additiveMl = calcAdditiveMl(additivePercentOfTotal, volumeMl)
  return Math.max(0, volumeMl - oilMl - additiveMl)
}

/** @deprecated use calcAdditiveMl — ratio is % of total volume, not diluent */
export function calcCarrierIngredientMl(
  ratioPercentOfTotal: number,
  volumeMl: number
): number {
  return calcAdditiveMl(ratioPercentOfTotal, volumeMl)
}
