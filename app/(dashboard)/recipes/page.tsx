import { supabase } from '@/lib/supabase'
import RecipesClient from '@/components/RecipesClient'

export default async function RecipesPage() {
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  return <RecipesClient recipes={recipes ?? []} />
}
