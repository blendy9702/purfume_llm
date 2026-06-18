import { supabase } from '@/lib/supabase'
import { getNoteLayers } from '@/lib/ingredients'
import DashboardClient from '@/components/DashboardClient'

async function getStats() {
  const [ingredientsResult, recentRecipesResult, recipeCountResult] = await Promise.all([
    supabase.from('ingredients').select('id, category, note_layers', { count: 'exact' }),
    supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('recipes').select('id', { count: 'exact', head: true }),
  ])

  const ingredientCount = ingredientsResult.count ?? 0
  const recipeCount = recipeCountResult.count ?? 0
  const recentRecipes = recentRecipesResult.data ?? []

  const categoryCount = {
    top: 0,
    middle: 0,
    base: 0,
    carrier: 0,
  }

  ingredientsResult.data?.forEach((i) => {
    if (i.category === 'carrier') {
      categoryCount.carrier++
      return
    }

    getNoteLayers(i).forEach((layer) => {
      categoryCount[layer]++
    })
  })

  return { ingredientCount, categoryCount, recipeCount, recentRecipes }
}

export default async function DashboardPage() {
  const { ingredientCount, categoryCount, recipeCount, recentRecipes } = await getStats()

  return (
    <DashboardClient
      ingredientCount={ingredientCount}
      categoryCount={categoryCount}
      recipeCount={recipeCount}
      recentRecipes={recentRecipes}
    />
  )
}
