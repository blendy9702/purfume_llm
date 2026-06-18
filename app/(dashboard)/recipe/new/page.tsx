import { supabase } from '@/lib/supabase'
import RecipeGeneratorClient from '@/components/RecipeGeneratorClient'
import type { CarrierOption } from '@/lib/recipe-carrier'

export default async function NewRecipePage() {
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, scent_profile, category')
    .eq('category', 'carrier')
    .order('name')

  const carriers: CarrierOption[] =
    ingredients?.map(({ id, name, scent_profile }) => ({
      id,
      name,
      scent_profile,
    })) ?? []

  return <RecipeGeneratorClient carriers={carriers} />
}
