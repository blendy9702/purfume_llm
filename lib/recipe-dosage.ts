/** 에센셜/프래그런스 오일 1ml ≈ 20방울 (표준 드로퍼 기준) */
export const DROPS_PER_ML = 20

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
  const drops = Math.round(rawDrops)

  let dropsLabel: string
  if (ratio <= 0) {
    dropsLabel = '0'
  } else if (drops === 0) {
    dropsLabel = '<1'
  } else {
    dropsLabel = String(drops)
  }

  return {
    ml: Math.round(ingredientMl * 100) / 100,
    drops,
    dropsLabel,
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
  return Math.round(volumeMl * (ratioPercentOfTotal / 100) * 100) / 100
}

export function calcOilVolumeMl(
  volumeMl: number,
  fragranceRate: string,
  fragrancePercent?: number | null
): number {
  return Math.round(volumeMl * getOilFraction(fragranceRate, fragrancePercent) * 100) / 100
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
  return Math.max(0, Math.round((volumeMl - oilMl - additiveMl) * 100) / 100)
}

/** @deprecated use calcAdditiveMl — ratio is % of total volume, not diluent */
export function calcCarrierIngredientMl(
  ratioPercentOfTotal: number,
  volumeMl: number
): number {
  return calcAdditiveMl(ratioPercentOfTotal, volumeMl)
}
