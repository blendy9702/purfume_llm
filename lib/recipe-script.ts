import type { Recipe, NoteItem } from '@/lib/supabase'
import { formatFragranceRateLabel, getFragranceRateConfig } from '@/lib/fragrance-rate'
import {
  calcAdditiveDosage,
  calcEthanolVolumeMl,
  calcIngredientDosage,
  calcOilVolumeMl,
  calcTotalDosage,
  formatMl,
  DROPS_PER_ML,
} from '@/lib/recipe-dosage'
import { getTotalAdditivePercent, resolveAdditivePercent } from '@/lib/recipe-carrier'

const OIL_TYPE_LABELS = {
  essential: '에센셜',
  fragrance: '프래그런스',
} as const

type OilTypeMap = Record<string, 'essential' | 'fragrance'>

function getOilTypeLabel(
  note: NoteItem,
  oilTypeByName: OilTypeMap
): string | null {
  const type = note.oil_type ?? oilTypeByName[note.name]
  if (!type) return null
  return OIL_TYPE_LABELS[type]
}

function formatFragranceNoteLines(
  notes: NoteItem[],
  volumeMl: number,
  fragranceRate: string,
  fragrancePercent: number | null | undefined,
  oilTypeByName: OilTypeMap
): string[] {
  return notes.map((note) => {
    const dosage = calcIngredientDosage(note.ratio, volumeMl, fragranceRate, fragrancePercent)
    const oilLabel = getOilTypeLabel(note, oilTypeByName)
    const typeSuffix = oilLabel ? ` (${oilLabel})` : ''
    return `- ${note.name}${typeSuffix}: ${formatMl(dosage.ml)}ml / ${dosage.dropsLabel}방울`
  })
}

function formatAdditiveLines(notes: NoteItem[], volumeMl: number): string[] {
  const isLegacySingle = notes.length === 1 && getTotalAdditivePercent(notes) >= 50
  const fallbackPercent = resolveAdditivePercent(notes)

  return notes.map((note) => {
    const ratio = isLegacySingle ? fallbackPercent : note.ratio
    const dosage = calcAdditiveDosage(ratio, volumeMl)
    return `- ${note.name}: ${formatMl(dosage.ml)}ml / ${dosage.dropsLabel}방울`
  })
}

export function buildRecipeManufacturingScript(
  recipe: Recipe,
  oilTypeByName: OilTypeMap = {}
): string {
  const carrierNotes = recipe.carrier_notes ?? []
  const additivePercent = resolveAdditivePercent(carrierNotes)
  const allNotes = [...recipe.top_notes, ...recipe.middle_notes, ...recipe.base_notes]
  const totalOilMl = calcOilVolumeMl(recipe.volume, recipe.fragrance_rate, recipe.fragrance_percent)
  const totalDosage = calcTotalDosage(
    allNotes,
    recipe.volume,
    recipe.fragrance_rate,
    recipe.fragrance_percent
  )
  const ethanolMl = calcEthanolVolumeMl(
    recipe.volume,
    recipe.fragrance_rate,
    recipe.fragrance_percent,
    additivePercent
  )
  const rateConfig = getFragranceRateConfig(recipe.fragrance_rate)
  const agingGuide = rateConfig
    ? rateConfig.agingGuide.split(' / ').slice(1).join(' / ') || rateConfig.agingGuide
    : null

  const lines: string[] = [
    recipe.name ?? '이름 없는 레시피',
    `${recipe.volume}ml · ${formatFragranceRateLabel(recipe.fragrance_rate, recipe.fragrance_percent)}`,
    '',
    `성별: ${recipe.gender}`,
  ]

  if (recipe.mbti) lines.push(`MBTI: ${recipe.mbti}`)
  if (recipe.enneagram?.length) lines.push(`에니어그램: ${recipe.enneagram.join(', ')}번`)
  lines.push('')

  if (recipe.top_notes.length > 0) {
    lines.push('[탑 노트]')
    lines.push(...formatFragranceNoteLines(
      recipe.top_notes,
      recipe.volume,
      recipe.fragrance_rate,
      recipe.fragrance_percent,
      oilTypeByName
    ))
    lines.push('')
  }

  if (recipe.middle_notes.length > 0) {
    lines.push('[미들 노트]')
    lines.push(...formatFragranceNoteLines(
      recipe.middle_notes,
      recipe.volume,
      recipe.fragrance_rate,
      recipe.fragrance_percent,
      oilTypeByName
    ))
    lines.push('')
  }

  if (recipe.base_notes.length > 0) {
    lines.push('[베이스 노트]')
    lines.push(...formatFragranceNoteLines(
      recipe.base_notes,
      recipe.volume,
      recipe.fragrance_rate,
      recipe.fragrance_percent,
      oilTypeByName
    ))
    lines.push('')
  }

  if (carrierNotes.length > 0) {
    lines.push('[첨가제]')
    lines.push(...formatAdditiveLines(carrierNotes, recipe.volume))
    lines.push('')
  }

  lines.push('[에탄올]')
  lines.push(`- ${formatMl(ethanolMl)}ml`)
  lines.push('')
  lines.push('[합계]')
  lines.push(`- 원료 오일: ${formatMl(totalOilMl)}ml / ${totalDosage.totalDrops}방울`)
  if (carrierNotes.length > 0) {
    const isLegacySingle = carrierNotes.length === 1 && getTotalAdditivePercent(carrierNotes) >= 50
    const additiveTotalMl = carrierNotes.reduce((sum, note) => {
      const ratio = isLegacySingle ? additivePercent : note.ratio
      return sum + calcAdditiveDosage(ratio, recipe.volume).ml
    }, 0)
    lines.push(`- 첨가제: ${formatMl(additiveTotalMl)}ml`)
  }
  lines.push(`- 에탄올: ${formatMl(ethanolMl)}ml`)
  lines.push(`- 기준: 1ml = ${DROPS_PER_ML}방울`)

  if (agingGuide) {
    lines.push('')
    lines.push(`숙성: ${agingGuide}`)
  }

  return lines.join('\n').trimEnd()
}
