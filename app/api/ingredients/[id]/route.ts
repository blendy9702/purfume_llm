import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { buildIngredientRecord, validateIngredientRecord } from '@/lib/ingredients'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase.from('ingredients').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, category, note_layers, oil_type, scent_profile } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: '재료명은 필수입니다.' }, { status: 400 })
  }

  if (!category) {
    return NextResponse.json({ error: '재료 유형은 필수입니다.' }, { status: 400 })
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
    .update(record)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
