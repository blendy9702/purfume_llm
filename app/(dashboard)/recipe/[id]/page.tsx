import { supabase } from '@/lib/supabase'
import { resolveRecipeNotes } from '@/lib/ingredients'
import { notFound } from 'next/navigation'
import RecipeCardClient from '@/components/RecipeCardClient'

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !recipe) {
    notFound()
  }

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('name, oil_type')

  const oilTypeByName: Record<string, 'essential' | 'fragrance'> = {}
  ingredients?.forEach((ingredient) => {
    if (ingredient.oil_type === 'essential' || ingredient.oil_type === 'fragrance') {
      oilTypeByName[ingredient.name] = ingredient.oil_type
    }
  })

  const resolvedRecipe = {
    ...recipe,
    top_notes: resolveRecipeNotes(recipe.top_notes ?? [], ingredients ?? []),
    middle_notes: resolveRecipeNotes(recipe.middle_notes ?? [], ingredients ?? []),
    base_notes: resolveRecipeNotes(recipe.base_notes ?? [], ingredients ?? []),
  }

  return <RecipeCardClient recipe={resolvedRecipe} oilTypeByName={oilTypeByName} />
}
