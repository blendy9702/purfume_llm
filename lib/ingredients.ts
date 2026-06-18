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
    .replace(/\band\b/g, '&')
    .replace(/[\s\-_·.]/g, '')
}

function normalizeForMatch(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\band\b/g, '&')
    .replace(/\s+/g, ' ')
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

  return undefined
}

export function resolveRecipeNotes<T extends { name: string; oil_type?: 'essential' | 'fragrance' | null }>(
  notes: NoteItemInput[],
  ingredients: T[]
): NoteItemInput[] {
  return notes.map((note) => {
    const ingredient = findIngredientByName(note.name, ingredients)
    if (!ingredient) return note

    const oilType = 'oil_type' in ingredient ? ingredient.oil_type : note.oil_type

    return {
      ...note,
      name: ingredient.name,
      oil_type: oilType ?? note.oil_type ?? null,
    }
  })
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
