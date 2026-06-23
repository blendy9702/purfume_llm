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

export function coerceCarrierNotesInput(input: unknown): CarrierNoteInput[] {
  if (!input) return []
  const raw = Array.isArray(input) ? input : [input]
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name : String(item.name ?? ''),
      ratio: parseCarrierRatio(item.ratio),
      description: typeof item.description === 'string' ? item.description : undefined,
    }))
    .filter((item) => item.name.trim().length > 0)
}

function parseCarrierRatio(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return Math.max(0, value)
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/%/g, '').trim())
    return Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
  }
  return 0
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

export function partitionCarrierNotes<T extends { name: string; ratio: number; description?: string }>(
  notes: T[],
  carrierIngredients: Ingredient[]
): { fragranceNotes: T[]; carrierNotes: T[] } {
  const fragranceNotes: T[] = []
  const carrierNotes: T[] = []

  for (const note of notes) {
    const ingredient = findIngredientByName(note.name, carrierIngredients)
    if (ingredient?.category === 'carrier') {
      carrierNotes.push({ ...note, name: ingredient.name })
    } else {
      fragranceNotes.push(note)
    }
  }

  return { fragranceNotes, carrierNotes }
}

export function resolveCarrierNotesFromLLM(
  llmNotes: unknown,
  selectedNames: string[],
  carrierIngredients: Ingredient[],
  extractedNotes: CarrierNoteInput[] = []
): NoteItem[] {
  if (selectedNames.length === 0) return []

  const selectedIngredients = selectedNames
    .map((name) => findIngredientByName(name, carrierIngredients))
    .filter((ing): ing is Ingredient => ing != null)

  if (selectedIngredients.length === 0) return []

  const allLlmNotes = [
    ...coerceCarrierNotesInput(llmNotes),
    ...extractedNotes,
  ]
  const resolvedFromLlm = resolveRecipeNotes(allLlmNotes, carrierIngredients)
  const selectedNameSet = new Set(selectedIngredients.map((i) => i.name))

  const matched: NoteItem[] = []
  for (const note of resolvedFromLlm) {
    const ingredient = findIngredientByName(note.name, carrierIngredients)
    if (!ingredient || !selectedNameSet.has(ingredient.name)) continue
    if (matched.some((m) => m.name === ingredient.name)) continue
    matched.push({
      name: ingredient.name,
      ratio: parseCarrierRatio(note.ratio),
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

  const normalized = normalizeCarrierRatios(matched)
  if (getTotalAdditivePercent(normalized) <= 0) {
    return buildFallbackCarrierNotes(selectedIngredients, matched)
  }
  return normalized
}

function buildFallbackCarrierNotes(
  selectedIngredients: Ingredient[],
  existing: NoteItem[] = []
): NoteItem[] {
  const descriptionByName = new Map(existing.map((note) => [note.name, note.description]))
  const each = Math.round((ADDITIVE_PERCENT_DEFAULT / selectedIngredients.length) * 10) / 10

  return selectedIngredients.map((ingredient) => ({
    name: ingredient.name,
    ratio: each,
    description: descriptionByName.get(ingredient.name) || defaultCarrierDescription(ingredient),
  }))
}

function defaultCarrierDescription(ingredient: Ingredient): string {
  return ingredient.scent_profile
    ? `${ingredient.scent_profile}. 에탄올과 별도로 소량 첨가하는 보조 용제입니다.`
    : '에탄올과 별도로 소량 첨가하는 보조 용제(DPG, 올리브 리퀴드 등)입니다.'
}

function normalizeCarrierRatios(notes: NoteItem[]): NoteItem[] {
  if (notes.length === 0) return []

  let working = notes.map((note) => ({
    ...note,
    ratio: parseCarrierRatio(note.ratio),
  }))

  let total = working.reduce((sum, note) => sum + note.ratio, 0)

  if (total <= 0) {
    const each = Math.round((ADDITIVE_PERCENT_DEFAULT / working.length) * 10) / 10
    return working.map((note) => ({ ...note, ratio: each }))
  }

  const zeroItems = working.filter((note) => note.ratio <= 0)
  if (zeroItems.length > 0) {
    const sharePerZero = Math.max(0.5, ADDITIVE_PERCENT_MIN / working.length)
    const zeroTotal = sharePerZero * zeroItems.length
    const positiveTotal = working.reduce((sum, note) => sum + (note.ratio > 0 ? note.ratio : 0), 0)
    const scale = positiveTotal > 0 ? Math.max(0, (total - zeroTotal) / positiveTotal) : 0

    working = working.map((note) => {
      if (note.ratio > 0) {
        return { ...note, ratio: Math.round(note.ratio * scale * 10) / 10 }
      }
      return { ...note, ratio: Math.round(sharePerZero * 10) / 10 }
    })
    total = working.reduce((sum, note) => sum + note.ratio, 0)
  }

  if (total > ADDITIVE_PERCENT_MAX) {
    const scale = ADDITIVE_PERCENT_MAX / total
    working = working.map((note) => ({
      ...note,
      ratio: Math.round(note.ratio * scale * 10) / 10,
    }))
    total = ADDITIVE_PERCENT_MAX
  }

  if (total < ADDITIVE_PERCENT_MIN) {
    const scale = ADDITIVE_PERCENT_MIN / total
    working = working.map((note) => ({
      ...note,
      ratio: Math.round(note.ratio * scale * 10) / 10,
    }))
  }

  return working.map((note) => ({
    ...note,
    ratio: Math.max(0.1, Math.round(note.ratio * 10) / 10),
  }))
}

/** 저장·표시 전 첨가제 비율 보정 */
export function normalizeCarrierNotesForDisplay(notes: NoteItem[]): NoteItem[] {
  if (notes.length === 0) return []
  return normalizeCarrierRatios(notes)
}

export function getTotalAdditivePercent(notes: { ratio: number }[]): number {
  return notes.reduce((sum, note) => sum + parseCarrierRatio(note.ratio), 0)
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

export function buildSelectedCarrierPromptSection(
  selectedNames: string[],
  carrierIngredients: Ingredient[],
  volume: number
): string {
  if (selectedNames.length === 0) return ''

  const lines = selectedNames
    .map((name) => {
      const ingredient = findIngredientByName(name, carrierIngredients)
      if (!ingredient) return `- ${name}`
      const role = ingredient.scent_profile ?? '조향 보조·용해 안정화'
      return `- ${ingredient.name} (${role})`
    })
    .join('\n')

  const exampleRatios =
    selectedNames.length === 1
      ? `{ "name": "${selectedNames[0]}", "ratio": 5, "description": "..." }`
      : selectedNames
          .map((name, i) => {
            const ratio = i === 0 ? 3 : 2
            return `{ "name": "${name}", "ratio": ${ratio}, "description": "..." }`
          })
          .join(',\n    ')

  return `## ★ 필수: 선택된 첨가제 (carrier_notes)
고객이 아래 첨가제를 **직접 선택**했습니다. top/middle/base_notes가 아닌 **carrier_notes 배열에만** 넣고, **선택된 항목을 빠짐없이** 포함하세요.
각 ratio는 **전체 ${volume}ml 대비 %**이며 **0이면 안 됩니다**. 합계 ${ADDITIVE_PERCENT_MIN}~${ADDITIVE_PERCENT_MAX}% 권장.

${lines}

carrier_notes 작성 예시:
"carrier_notes": [
    ${exampleRatios}
  ]`
}
