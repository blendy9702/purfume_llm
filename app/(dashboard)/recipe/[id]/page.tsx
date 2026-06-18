import { supabase } from '@/lib/supabase'
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

  return <RecipeCardClient recipe={recipe} />
}
