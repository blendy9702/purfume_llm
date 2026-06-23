export type NoteLayer = 'top' | 'middle' | 'base'

export const NOTE_LAYERS: NoteLayer[] = ['top', 'middle', 'base']

export const NOTE_LAYER_LABELS: Record<NoteLayer, string> = {
  top: '탑',
  middle: '미들',
  base: '베이스',
}

export function getNoteLayers(ingredient: {
  category: string
  note_layers?: NoteLayer[] | null
}): NoteLayer[] {
  if (ingredient.note_layers?.length) {
    return [...ingredient.note_layers].sort(
      (a, b) => NOTE_LAYERS.indexOf(a) - NOTE_LAYERS.indexOf(b)
    )
  }

  if (ingredient.category === 'all') return [...NOTE_LAYERS]
  if (NOTE_LAYERS.includes(ingredient.category as NoteLayer)) {
    return [ingredient.category as NoteLayer]
  }

  return []
}

export function formatNoteLayers(layers: NoteLayer[]): string {
  if (layers.length === 0) return ''
  if (layers.length === NOTE_LAYERS.length) return '탑·미들·베이스'
  return layers.map((layer) => NOTE_LAYER_LABELS[layer]).join('·')
}

export function ingredientMatchesNoteFilter(
  ingredient: { category: string; note_layers?: NoteLayer[] | null },
  filter: string
): boolean {
  if (filter === 'carrier') return ingredient.category === 'carrier'
  if (NOTE_LAYERS.includes(filter as NoteLayer)) {
    return getNoteLayers(ingredient).includes(filter as NoteLayer)
  }
  return ingredient.category === filter
}

export function resolveCategoryFromNoteLayers(
  noteLayers: NoteLayer[]
): 'top' | 'middle' | 'base' | 'all' {
  if (noteLayers.length === NOTE_LAYERS.length) return 'all'
  if (noteLayers.length === 1) return noteLayers[0]
  return 'all'
}

export type OilType = 'essential' | 'fragrance'
export type IngredientCategory = 'top' | 'middle' | 'base' | 'all' | 'carrier'

const VALID_OIL_TYPES: OilType[] = ['essential', 'fragrance']

export type IngredientPayloadInput = {
  name: string
  category?: string
  note_layers?: string[] | null
  oil_type?: string | null
  scent_profile?: string | null
}

export type IngredientRecord = {
  name: string
  category: IngredientCategory
  note_layers: NoteLayer[] | null
  oil_type: OilType | null
  scent_profile: string | null
}

function resolveOilType(
  category: string,
  oilType?: string | null
): OilType | null {
  if (category === 'carrier') return null
  if (!oilType || !VALID_OIL_TYPES.includes(oilType as OilType)) {
    return null
  }
  return oilType as OilType
}

function normalizeNoteLayers(
  category: string,
  noteLayers?: string[] | null
): NoteLayer[] | null {
  if (category === 'carrier') return null

  const layers = (noteLayers ?? [])
    .filter((layer): layer is NoteLayer =>
      NOTE_LAYERS.includes(layer as NoteLayer)
    )
    .sort((a, b) => NOTE_LAYERS.indexOf(a) - NOTE_LAYERS.indexOf(b))

  if (layers.length > 0) return layers

  if (category === 'all') return [...NOTE_LAYERS]
  if (NOTE_LAYERS.includes(category as NoteLayer)) return [category as NoteLayer]

  return null
}

export function buildIngredientRecord(
  item: IngredientPayloadInput
): IngredientRecord {
  const isCarrier = item.category === 'carrier'
  const note_layers = normalizeNoteLayers(item.category ?? '', item.note_layers)
  const category = isCarrier
    ? 'carrier'
    : resolveCategoryFromNoteLayers(note_layers ?? [])
  const oil_type = resolveOilType(category, item.oil_type)

  return {
    name: item.name.trim(),
    category,
    note_layers,
    oil_type,
    scent_profile: item.scent_profile?.trim() || null,
  }
}

export function validateIngredientRecord(
  record: IngredientRecord
): string | null {
  if (!record.name) return '재료명은 필수입니다.'
  if (record.category !== 'carrier' && (!record.note_layers || record.note_layers.length === 0)) {
    return '향료 재료는 노트 구분을 1개 이상 선택해야 합니다.'
  }
  if (record.category !== 'carrier' && !record.oil_type) {
    return '향료 재료는 오일 종류(에센셜/프래그런스)를 선택해야 합니다.'
  }
  return null
}

export type NoteItemInput = {
  name: string
  ratio: number
  description?: string
  oil_type?: 'essential' | 'fragrance' | null
}

function compactName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\band\b/g, '')
    .replace(/앤/g, '')
    .replace(/[\s\-_·.&]/g, '')
}

function normalizeForMatch(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\band\b/g, '앤')
    .replace(/\s+/g, ' ')
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const curr = new Array<number>(b.length + 1)

  for (let i = 0; i < a.length; i++) {
    curr[0] = i + 1
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1
      curr[j + 1] = Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }

  return prev[b.length]
}

function findFuzzyIngredientMatch<T extends { name: string }>(
  name: string,
  ingredients: T[]
): T | undefined {
  const compact = compactName(name)
  if (compact.length < 4) return undefined

  const scored = ingredients
    .map((ingredient) => {
      const candidate = compactName(ingredient.name)
      const dist = levenshtein(compact, candidate)
      const maxLen = Math.max(compact.length, candidate.length, 1)
      return { ingredient, dist, score: dist / maxLen }
    })
    .filter(({ dist, score }) => dist <= Math.max(2, Math.floor(compact.length * 0.2)) && score <= 0.2)
    .sort((a, b) => a.score - b.score || a.dist - b.dist)

  if (scored.length === 0) return undefined
  if (scored.length === 1) return scored[0].ingredient

  const [best, second] = scored
  if (best.dist + 1 < second.dist || best.score < second.score * 0.6) {
    return best.ingredient
  }

  return undefined
}

export function findIngredientByName<T extends { name: string }>(
  name: string,
  ingredients: T[]
): T | undefined {
  const trimmed = name.trim()
  const normalized = normalizeForMatch(trimmed)

  const exact = ingredients.find((i) => i.name === trimmed)
  if (exact) return exact

  const caseInsensitive = ingredients.find((i) => normalizeForMatch(i.name) === normalized)
  if (caseInsensitive) return caseInsensitive

  const compact = compactName(trimmed)
  const compactMatch = ingredients.find((i) => compactName(i.name) === compact)
  if (compactMatch) return compactMatch

  // 부분 일치 (유일한 후보만)
  const partialMatches = ingredients.filter(
    (i) =>
      compactName(i.name).includes(compact) ||
      compact.includes(compactName(i.name))
  )
  if (partialMatches.length === 1) return partialMatches[0]

  return findFuzzyIngredientMatch(trimmed, ingredients)
}

export function resolveRecipeNotes<T extends { name: string; oil_type?: 'essential' | 'fragrance' | null }>(
  notes: NoteItemInput[],
  ingredients: T[]
): NoteItemInput[] {
  const resolved: NoteItemInput[] = []

  for (const note of notes) {
    const ingredient = findIngredientByName(note.name, ingredients)
    if (!ingredient) continue

    const oilType = 'oil_type' in ingredient ? ingredient.oil_type : note.oil_type

    resolved.push({
      ...note,
      name: ingredient.name,
      oil_type: oilType ?? note.oil_type ?? null,
    })
  }

  if (resolved.length === notes.length) return resolved
  return renormalizeNoteRatios(resolved)
}

export function renormalizeNoteRatios(notes: NoteItemInput[]): NoteItemInput[] {
  const total = notes.reduce((sum, note) => sum + note.ratio, 0)
  if (total <= 0) return notes

  return notes.map((note) => ({
    ...note,
    ratio: Math.round((note.ratio / total) * 1000) / 10,
  }))
}

export function ingredientToFormData(ingredient: {
  name: string
  category: string
  note_layers?: NoteLayer[] | null
  oil_type?: OilType | null
  scent_profile?: string | null
}) {
  const isCarrier = ingredient.category === 'carrier'
  return {
    kind: isCarrier ? ('carrier' as const) : ('fragrance' as const),
    note_layers: isCarrier ? [] : getNoteLayers(ingredient),
    oil_type: ingredient.oil_type ?? 'essential',
    scent_profile: ingredient.scent_profile ?? '',
    namesText: ingredient.name,
  }
}
