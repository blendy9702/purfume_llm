import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  buildIngredientRecord,
  validateIngredientRecord,
  type IngredientPayloadInput,
} from '@/lib/ingredients'

export async function GET() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('category')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (Array.isArray(body.items)) {
    const items = (body.items as IngredientPayloadInput[])
      .map((item) =>
        buildIngredientRecord({
          name: item.name?.trim() ?? '',
          category: item.category,
          note_layers: item.note_layers,
          oil_type: item.oil_type,
          scent_profile: item.scent_profile?.trim() || null,
        })
      )
      .filter((item) => Boolean(item.name && item.category))

    if (items.length === 0) {
      return NextResponse.json(
        { error: '추가할 재료가 없습니다.' },
        { status: 400 }
      )
    }

    for (const item of items) {
      const validationError = validateIngredientRecord(item)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }
    }

    const { data, error } = await supabase.from('ingredients').insert(items).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  }

  const { name, category, note_layers, oil_type, scent_profile } = body

  if (!name?.trim() || !category) {
    return NextResponse.json(
      { error: '재료명과 카테고리는 필수입니다.' },
      { status: 400 }
    )
  }

  const record = buildIngredientRecord({
    name: name.trim(),
    category,
    note_layers,
    oil_type,
    scent_profile: scent_profile?.trim() || null,
  })

  const validationError = validateIngredientRecord(record)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ingredients')
    .insert(record)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
