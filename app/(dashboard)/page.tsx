import { supabase } from '@/lib/supabase'
import { getNoteLayers } from '@/lib/ingredients'
import DashboardClient from '@/components/DashboardClient'

async function getStats() {
  const [ingredientsResult, recipesResult] = await Promise.all([
    supabase.from('ingredients').select('id, category, note_layers', { count: 'exact' }),
    supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const ingredientCount = ingredientsResult.count ?? 0
  const recipes = recipesResult.data ?? []

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

  return { ingredientCount, categoryCount, recipes }
}

export default async function DashboardPage() {
  const { ingredientCount, categoryCount, recipes } = await getStats()

  return (
    <DashboardClient
      ingredientCount={ingredientCount}
      categoryCount={categoryCount}
      recipes={recipes}
    />
  )
}
