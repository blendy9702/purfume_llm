import { findIngredientByName, resolveRecipeNotes } from '@/lib/ingredients'
import type { Ingredient, NoteItem } from '@/lib/supabase'

export type CarrierOption = Pick<Ingredient, 'id' | 'name' | 'scent_profile'>

/** 첨가제 합계 권장 범위 — 전체 용량 대비 % */
export const ADDITIVE_PERCENT_MIN = 1
export const ADDITIVE_PERCENT_MAX = 15
export const ADDITIVE_PERCENT_DEFAULT = 5

type CarrierNoteInput = { name: string; ratio: number; description?: string }

export function normalizeCarrierNames(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
      .map((name) => name.trim())
  }
  if (typeof input === 'string' && input.trim()) return [input.trim()]
  return []
}

export function validateCarrierSelection(
  carrierNames: string[],
  carrierIngredients: Ingredient[]
): string | null {
  for (const name of carrierNames) {
    if (!findIngredientByName(name, carrierIngredients)) {
      return `등록되지 않은 첨가제입니다: ${name}`
    }
  }
  return null
}

export function resolveCarrierNotesFromLLM(
  llmNotes: CarrierNoteInput[] | undefined,
  selectedNames: string[],
  carrierIngredients: Ingredient[]
): NoteItem[] {
  if (selectedNames.length === 0) return []

  const selectedIngredients = selectedNames
    .map((name) => findIngredientByName(name, carrierIngredients))
    .filter((ing): ing is Ingredient => ing != null)

  if (selectedIngredients.length === 0) return []

  const resolvedFromLlm = resolveRecipeNotes(llmNotes ?? [], carrierIngredients)
  const selectedNameSet = new Set(selectedIngredients.map((i) => i.name))

  const matched: NoteItem[] = []
  for (const note of resolvedFromLlm) {
    const ingredient = findIngredientByName(note.name, carrierIngredients)
    if (!ingredient || !selectedNameSet.has(ingredient.name)) continue
    if (matched.some((m) => m.name === ingredient.name)) continue
    matched.push({
      name: ingredient.name,
      ratio: Math.max(0, Number(note.ratio) || 0),
      description: note.description?.trim() || defaultCarrierDescription(ingredient),
    })
  }

  for (const ingredient of selectedIngredients) {
    if (matched.some((m) => m.name === ingredient.name)) continue
    matched.push({
      name: ingredient.name,
      ratio: 0,
      description: defaultCarrierDescription(ingredient),
    })
  }

  return normalizeCarrierRatios(matched)
}

function defaultCarrierDescription(ingredient: Ingredient): string {
  return ingredient.scent_profile
    ? `${ingredient.scent_profile}. 에탄올과 별도로 소량 첨가하는 보조 용제입니다.`
    : '에탄올과 별도로 소량 첨가하는 보조 용제(DPG, 올리브 리퀴드 등)입니다.'
}

function normalizeCarrierRatios(notes: NoteItem[]): NoteItem[] {
  if (notes.length === 0) return []

  let total = notes.reduce((sum, note) => sum + note.ratio, 0)

  if (total <= 0) {
    const each = Math.round((ADDITIVE_PERCENT_DEFAULT / notes.length) * 10) / 10
    return notes.map((note) => ({ ...note, ratio: each }))
  }

  if (total > ADDITIVE_PERCENT_MAX) {
    const scale = ADDITIVE_PERCENT_MAX / total
    total = ADDITIVE_PERCENT_MAX
    notes = notes.map((note) => ({
      ...note,
      ratio: Math.round(note.ratio * scale * 10) / 10,
    }))
  }

  if (total < ADDITIVE_PERCENT_MIN) {
    const scale = ADDITIVE_PERCENT_MIN / total
    notes = notes.map((note) => ({
      ...note,
      ratio: Math.round(note.ratio * scale * 10) / 10,
    }))
  }

  return notes.map((note) => ({
    ...note,
    ratio: Math.round(note.ratio * 10) / 10,
  }))
}

export function getTotalAdditivePercent(notes: { ratio: number }[]): number {
  return notes.reduce((sum, note) => sum + note.ratio, 0)
}

/** 예전 레시피는 잔량 100%를 첨가제로 저장했을 수 있음 */
export function resolveAdditivePercent(notes: { ratio: number }[]): number {
  const total = getTotalAdditivePercent(notes)
  if (notes.length === 1 && total >= 50) return ADDITIVE_PERCENT_DEFAULT
  return total
}

export function toggleCarrierName(names: string[], name: string): string[] {
  return names.includes(name) ? names.filter((n) => n !== name) : [...names, name]
}
