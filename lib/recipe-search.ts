import type { Recipe } from '@/lib/supabase'

function collectRecipeNoteText(recipe: Recipe): string {
  const notes = [
    ...recipe.top_notes,
    ...recipe.middle_notes,
    ...recipe.base_notes,
    ...(recipe.carrier_notes ?? []),
  ]

  return notes
    .flatMap((note) => [note.name, note.description])
    .filter(Boolean)
    .join(' ')
}

export function recipeMatchesSearch(recipe: Recipe, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    recipe.name,
    recipe.summary,
    recipe.gender,
    recipe.mbti,
    recipe.fragrance_rate,
    recipe.special_notes,
    recipe.enneagram?.join(' '),
    collectRecipeNoteText(recipe),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

export function filterRecipesBySearch(recipes: Recipe[], query: string): Recipe[] {
  if (!query.trim()) return recipes
  return recipes.filter((recipe) => recipeMatchesSearch(recipe, query))
}
