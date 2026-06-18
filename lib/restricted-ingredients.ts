import type { Ingredient } from '@/lib/supabase'
import type { NoteItemInput } from '@/lib/ingredients'

type RestrictedGroup = {
  label: string
  ingredientPatterns: RegExp[]
  mentionPatterns: RegExp[]
}

const RESTRICTED_GROUPS: RestrictedGroup[] = [
  {
    label: '커피',
    ingredientPatterns: [/커피/i, /coffee/i],
    mentionPatterns: [/커피/i, /coffee/i],
  },
  {
    label: '헤이즐넛',
    ingredientPatterns: [/헤이즐/i, /hazelnut/i, /hazel/i],
    mentionPatterns: [/헤이즐/i, /hazelnut/i, /hazel/i],
  },
]

function matchesPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function getRestrictedGroupForIngredient(name: string): RestrictedGroup | undefined {
  return RESTRICTED_GROUPS.find((group) =>
    matchesPatterns(name, group.ingredientPatterns)
  )
}

export function isRestrictedIngredient(name: string): boolean {
  return Boolean(getRestrictedGroupForIngredient(name))
}

export function isRestrictedIngredientAllowed(
  name: string,
  mentionText: string
): boolean {
  const group = getRestrictedGroupForIngredient(name)
  if (!group) return true
  return matchesPatterns(mentionText, group.mentionPatterns)
}

export function buildMentionText(specialNotes?: string | null): string {
  return specialNotes?.trim() ?? ''
}

export function filterIngredientsByMention(
  ingredients: Ingredient[],
  mentionText: string
): Ingredient[] {
  return ingredients.filter((ingredient) => {
    if (ingredient.category === 'carrier') return true
    return isRestrictedIngredientAllowed(ingredient.name, mentionText)
  })
}

export function buildRestrictedIngredientsPromptSection(
  ingredients: Ingredient[],
  mentionText: string
): string {
  const restricted = ingredients
    .filter((i) => i.category !== 'carrier' && isRestrictedIngredient(i.name))
    .map((i) => i.name)

  if (restricted.length === 0) return ''

  const allowed = restricted.filter((name) =>
    isRestrictedIngredientAllowed(name, mentionText)
  )
  const blocked = restricted.filter(
    (name) => !isRestrictedIngredientAllowed(name, mentionText)
  )

  const lines = ['## 제한 재료 (필수 준수)']

  if (blocked.length > 0) {
    lines.push(
      `- 특이사항에 명시되지 않았으므로 **절대 사용 금지**: ${blocked.join(', ')}`,
      '- 커피·헤이즐넛 계열은 고객이 특이사항에서 직접 요청한 경우에만 사용할 수 있습니다.'
    )
  }

  if (allowed.length > 0) {
    lines.push(`- 특이사항에 요청되어 사용 가능: ${allowed.join(', ')}`)
  }

  return lines.join('\n')
}

export function filterRestrictedNotes(
  notes: NoteItemInput[],
  mentionText: string
): NoteItemInput[] {
  const filtered = notes.filter((note) =>
    isRestrictedIngredientAllowed(note.name, mentionText)
  )

  if (filtered.length === 0 || filtered.length === notes.length) {
    return filtered
  }

  const total = filtered.reduce((sum, note) => sum + note.ratio, 0)
  if (total <= 0) return filtered

  return filtered.map((note) => ({
    ...note,
    ratio: Math.round((note.ratio / total) * 1000) / 10,
  }))
}
