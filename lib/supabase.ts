import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Ingredient = {
  id: string
  name: string
  category: 'top' | 'middle' | 'base' | 'all' | 'carrier'
  note_layers: ('top' | 'middle' | 'base')[] | null
  oil_type: 'essential' | 'fragrance' | null
  scent_profile: string | null
  description: string | null
  created_at: string
}

export type NoteItem = {
  name: string
  ratio: number
  description: string
  oil_type?: 'essential' | 'fragrance' | null
}

export type Recipe = {
  id: string
  name: string | null
  gender: string
  fragrance_rate: string
  fragrance_percent: number | null
  volume: number
  mbti: string | null
  enneagram: number[] | null
  special_notes: string | null
  top_notes: NoteItem[]
  middle_notes: NoteItem[]
  base_notes: NoteItem[]
  summary: string | null
  created_at: string
}
