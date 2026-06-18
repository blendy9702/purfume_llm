import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase, type Ingredient } from '@/lib/supabase'
import { formatNoteLayers, getNoteLayers } from '@/lib/ingredients'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { gender, fragrance_rate, volume, mbti, enneagram, special_notes } = body

  const { data: ingredients, error: ingredientsError } = await supabase
    .from('ingredients')
    .select('*')
    .order('category')

  if (ingredientsError) {
    return NextResponse.json({ error: '재료를 불러올 수 없습니다.' }, { status: 500 })
  }

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json(
      { error: '등록된 재료가 없습니다. 먼저 재료를 등록해주세요.' },
      { status: 400 }
    )
  }

  const ingredientsList = ingredients
    .map((i: Ingredient) => {
      if (i.category === 'carrier') {
        const parts = ['베이스 용제']
        if (i.scent_profile) parts.push(i.scent_profile)
        return `- ${i.name} (${parts.join(', ')})`
      }

      const parts = [`${formatNoteLayers(getNoteLayers(i))} 노트`]
      if (i.oil_type) parts.push(i.oil_type === 'essential' ? '에센셜 오일' : '프래그런스 오일')
      if (i.scent_profile) parts.push(i.scent_profile)
      return `- ${i.name} (${parts.join(', ')})`
    })
    .join('\n')

  const prompt = `당신은 전문 향수 조향사입니다. 고객 정보를 바탕으로 맞춤형 향수 레시피를 제안해주세요.

## 고객 정보
- 성별: ${gender}
- 부향률: ${fragrance_rate}
- 용량: ${volume}ml
${mbti ? `- MBTI: ${mbti}` : ''}
${Array.isArray(enneagram) && enneagram.length > 0 ? `- 에니어그램: ${enneagram.join(', ')}번` : ''}
${special_notes ? `- 특이사항: ${special_notes}` : ''}

## 사용 가능한 재료
${ingredientsList}

## 응답 형식 (반드시 아래 JSON 형식으로만 응답하세요)
{
  "name": "향수 이름 (창의적으로)",
  "summary": "이 향수의 전체적인 특성과 분위기 설명 (2-3문장)",
  "top_notes": [
    { "name": "재료명", "ratio": 숫자(퍼센트), "description": "이 재료를 선택한 이유" }
  ],
  "middle_notes": [
    { "name": "재료명", "ratio": 숫자(퍼센트), "description": "이 재료를 선택한 이유" }
  ],
  "base_notes": [
    { "name": "재료명", "ratio": 숫자(퍼센트), "description": "이 재료를 선택한 이유" }
  ]
}

## 규칙
- 사용 가능한 재료 목록에서만 선택하세요
- top_notes 비율 합계: ${fragrance_rate === 'Eau de Cologne' ? '30-40%' : fragrance_rate === 'Eau de Toilette' ? '25-35%' : '15-25%'}
- middle_notes 비율 합계: ${fragrance_rate === 'Eau de Cologne' ? '40-50%' : fragrance_rate === 'Eau de Toilette' ? '40-50%' : '40-55%'}
- base_notes 비율 합계: ${fragrance_rate === 'Eau de Cologne' ? '15-25%' : fragrance_rate === 'Eau de Toilette' ? '20-30%' : '25-40%'}
- 모든 노트의 비율 합계는 반드시 100%
- 각 재료의 노트 구분(탑/미들/베이스)을 반드시 지키세요. 복수 노트가 표시된 재료는 해당 노트 중 하나에만 배치하세요
- category가 'carrier'인 재료(증류수, DPG, 올리브 리퀴드 등)는 희석용 베이스 용제이며 top/middle/base 노트에 포함하지 마세요
- top notes: 2-4개, middle notes: 3-5개, base notes: 2-4개
- JSON 외 다른 텍스트 없이 JSON만 반환`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('AI 응답이 없습니다.')
    }

    const recipe = JSON.parse(content)

    const { data: saved, error: saveError } = await supabase
      .from('recipes')
      .insert({
        name: recipe.name,
        gender,
        fragrance_rate,
        volume,
        mbti: mbti || null,
        enneagram: Array.isArray(enneagram) && enneagram.length > 0 ? enneagram : null,
        special_notes: special_notes || null,
        top_notes: recipe.top_notes,
        middle_notes: recipe.middle_notes,
        base_notes: recipe.base_notes,
        summary: recipe.summary,
      })
      .select()
      .single()

    if (saveError) {
      return NextResponse.json({ error: '레시피 저장 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json(saved)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'AI 레시피 생성에 실패했습니다.' }, { status: 500 })
  }
}
