import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'
import { supabase, type Ingredient } from '@/lib/supabase'
import { formatNoteLayers, getNoteLayers, resolveRecipeNotes } from '@/lib/ingredients'
import {
  buildDiversityPromptSection,
  shuffleIngredientsList,
} from '@/lib/recipe-diversity'
import { buildPersonalityPromptSection, mergeRecipeSummary } from '@/lib/recipe-personality'
import {
  buildMentionText,
  buildRestrictedIngredientsPromptSection,
  filterIngredientsByMention,
  filterRestrictedNotes,
} from '@/lib/restricted-ingredients'
import { clampFragrancePercent, getFragranceRateConfig } from '@/lib/fragrance-rate'
import {
  ADDITIVE_PERCENT_MAX,
  ADDITIVE_PERCENT_MIN,
  normalizeCarrierNames,
  resolveCarrierNotesFromLLM,
  validateCarrierSelection,
} from '@/lib/recipe-carrier'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    gender,
    fragrance_rate,
    fragrance_percent,
    volume,
    mbti,
    enneagram,
    special_notes,
    carrier_names,
    carrier_name,
  } = body

  const selectedCarrierNames = normalizeCarrierNames(carrier_names ?? carrier_name)

  const validatedPercent = clampFragrancePercent(fragrance_rate, Number(fragrance_percent))
  if (!fragrance_rate || validatedPercent === null) {
    return NextResponse.json(
      { error: '부향률과 해당 범위 내 농도(%)를 선택해주세요.' },
      { status: 400 }
    )
  }

  const rateConfig = getFragranceRateConfig(fragrance_rate)

  const { data: ingredients, error: ingredientsError } = await supabase
    .from('ingredients')
    .select('*')
    .order('category')

  const { data: recentRecipes } = await supabase
    .from('recipes')
    .select('top_notes, middle_notes, base_notes')
    .order('created_at', { ascending: false })
    .limit(12)

  if (ingredientsError) {
    return NextResponse.json({ error: '재료를 불러올 수 없습니다.' }, { status: 500 })
  }

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json(
      { error: '등록된 재료가 없습니다. 먼저 재료를 등록해주세요.' },
      { status: 400 }
    )
  }

  const mentionText = buildMentionText(special_notes)
  const allowedIngredients = filterIngredientsByMention(ingredients, mentionText)
  const fragranceIngredients = allowedIngredients.filter((i) => i.category !== 'carrier')
  const carrierIngredients = allowedIngredients.filter((i) => i.category === 'carrier')
  const carrierError = validateCarrierSelection(selectedCarrierNames, carrierIngredients)
  if (carrierError) {
    return NextResponse.json({ error: carrierError }, { status: 400 })
  }

  const validIngredientNames = fragranceIngredients.map((i) => i.name).join(', ')
  const validCarrierNames = selectedCarrierNames.join(', ')
  const restrictedSection = buildRestrictedIngredientsPromptSection(ingredients, mentionText)
  const diversitySection = buildDiversityPromptSection(recentRecipes ?? [], allowedIngredients)
  const personalitySection = buildPersonalityPromptSection(
    gender,
    mbti,
    Array.isArray(enneagram) ? enneagram : undefined
  )

  const ingredientsList = shuffleIngredientsList(allowedIngredients)
    .map((i: Ingredient) => {
      if (i.category === 'carrier') {
        const parts = ['첨가제 (DPG·올리브 리퀴드 등, 에탄올과 별도)']
        if (i.scent_profile) parts.push(i.scent_profile)
        return `- ${i.name} (${parts.join(', ')})`
      }

      const parts = [`${formatNoteLayers(getNoteLayers(i))} 노트`]
      if (i.oil_type) parts.push(i.oil_type === 'essential' ? '에센셜 오일' : '프래그런스 오일')
      if (i.scent_profile) parts.push(i.scent_profile)
      return `- ${i.name} (${parts.join(', ')})`
    })
    .join('\n')

  const carrierNotesSection =
    selectedCarrierNames.length > 0
      ? `,
  "carrier_notes": [
    { "name": "첨가제명 (선택 목록과 동일)", "ratio": 숫자(전체 용량 대비 %), "description": "이 첨가제를 선택·배분한 이유 (한국어)" }
  ]`
      : ''

  const carrierRulesSection =
    selectedCarrierNames.length > 0
      ? `
- carrier_notes에는 아래 선택된 첨가제만 포함하세요: ${validCarrierNames}
- carrier_notes의 ratio는 **전체 ${volume}ml 용량 대비 %** (에탄올·원료 오일과 별도)
- carrier_notes ratio 합계: ${ADDITIVE_PERCENT_MIN}~${ADDITIVE_PERCENT_MAX}% (소량 첨가 — DPG·올리브 리퀴드 등 역할에 맞게 AI가 적절히 배분)
- 선택된 첨가제를 carrier_notes에 모두 포함하고, top/middle/base_notes에는 넣지 마세요`
      : `
- category가 'carrier'인 재료(DPG, 올리브 리퀴드 등)는 top/middle/base 노트에 포함하지 마세요`

  const prompt = `당신은 성향 심리학에 정통한 전문 향수 조향사입니다.
고객의 성별, MBTI, 에니어그램을 깊이 분석하여 그 사람만의 향수 레시피를 설계하세요.

## 제조 조건
- 부향률: ${fragrance_rate} (원료 오일 ${validatedPercent}% — 허용 범위 ${rateConfig?.min}~${rateConfig?.max}%)
- 용량: ${volume}ml
${selectedCarrierNames.length > 0 ? `- 선택된 첨가제 (에탄올과 별도, AI가 비율 결정): ${validCarrierNames}` : ''}
${special_notes ? `- 특이사항: ${special_notes}` : ''}

${personalitySection}

${restrictedSection ? `${restrictedSection}\n` : ''}## 사용 가능한 재료
${ingredientsList}

${diversitySection}

## 응답 형식 (반드시 아래 JSON 형식으로만 응답하세요)
{
  "personality_analysis": "성별·MBTI·에니어그램 종합 분석 (4-6문장, 한국어). 이 사람에게 어울리는 향 방향과 피해야 할 요소를 명확히 서술",
  "name": "세련된 영어 향수명 (2-4단어, 분석된 성향을 반영한 럭셔리 네이밍. 반드시 영어로만)",
  "summary": "완성된 향수의 전체적 특성과 이 성향에게 왜 맞는지 (2-3문장, 한국어)",
  "top_notes": [
    { "name": "재료명 (목록과 동일)", "ratio": 숫자(퍼센트), "description": "이 재료를 선택한 이유 — 반드시 성별/MBTI/에니어그램과 연결 (한국어)" }
  ],
  "middle_notes": [
    { "name": "재료명 (목록과 동일)", "ratio": 숫자(퍼센트), "description": "이 재료를 선택한 이유 — 반드시 성별/MBTI/에니어그램과 연결 (한국어)" }
  ],
  "base_notes": [
    { "name": "재료명 (목록과 동일)", "ratio": 숫자(퍼센트), "description": "이 재료를 선택한 이유 — 반드시 성별/MBTI/에니어그램과 연결 (한국어)" }
  ]${carrierNotesSection}
}

## 사용 가능한 재료명 (top/middle/base_notes의 name에 아래 이름만 글자 그대로 사용)
${validIngredientNames}

## 규칙
- 사용 가능한 재료 목록에서만 선택하세요
- top_notes/middle_notes/base_notes의 name 필드는 위 재료명 목록에서 **한 글자도 바꾸지 않고 그대로** 복사하세요. 영어로 번역·로마자 표기·다른 표현으로 바꾸지 마세요
- description 필드는 한국어로 작성하고, 각 재료마다 고객 성향(MBTI/에니어그램/성별)과의 연관을 간단히 언급하세요
- top_notes 비율 합계: ${fragrance_rate === 'Eau de Cologne' ? '30-40%' : fragrance_rate === 'Eau de Toilette' ? '25-35%' : '15-25%'}
- middle_notes 비율 합계: ${fragrance_rate === 'Eau de Cologne' ? '40-50%' : fragrance_rate === 'Eau de Toilette' ? '40-50%' : '40-55%'}
- base_notes 비율 합계: ${fragrance_rate === 'Eau de Cologne' ? '15-25%' : fragrance_rate === 'Eau de Toilette' ? '20-30%' : '25-40%'}
- 모든 노트의 비율 합계는 반드시 100%
- 각 재료의 노트 구분(탑/미들/베이스)을 반드시 지키세요. 복수 노트가 표시된 재료는 해당 노트 중 하나에만 배치하세요
- 에탄올은 주용 희석제이며 서버에서 자동 계산합니다 (원료 오일·첨가제를 제외한 나머지)${carrierRulesSection}
- top notes: 2-4개, middle notes: 3-5개, base notes: 2-4개
- 에센셜 오일과 프래그런스 오일을 골고루 섞어 조합의 다양성을 높이세요 (한쪽만 쓰지 마세요)
- 최상위 name 필드(향수 제목)만 영어로 작성하세요. 재료 name은 위 재료명 목록을 그대로 복사하고, description은 한국어로 작성하세요
- JSON 외 다른 텍스트 없이 JSON만 반환`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.95,
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('AI 응답이 없습니다.')
    }

    const recipe = JSON.parse(content)

    const topNotes = filterRestrictedNotes(
      resolveRecipeNotes(recipe.top_notes ?? [], fragranceIngredients),
      mentionText
    )
    const middleNotes = filterRestrictedNotes(
      resolveRecipeNotes(recipe.middle_notes ?? [], fragranceIngredients),
      mentionText
    )
    const baseNotes = filterRestrictedNotes(
      resolveRecipeNotes(recipe.base_notes ?? [], fragranceIngredients),
      mentionText
    )
    const carrierNotes = resolveCarrierNotesFromLLM(
      recipe.carrier_notes,
      selectedCarrierNames,
      carrierIngredients
    )

    const { data: saved, error: saveError } = await supabase
      .from('recipes')
      .insert({
        name: recipe.name,
        gender,
        fragrance_rate,
        fragrance_percent: validatedPercent,
        volume,
        mbti: mbti || null,
        enneagram: Array.isArray(enneagram) && enneagram.length > 0 ? enneagram : null,
        special_notes: special_notes || null,
        top_notes: topNotes,
        middle_notes: middleNotes,
        base_notes: baseNotes,
        carrier_notes: carrierNotes,
        summary: mergeRecipeSummary(recipe.personality_analysis, recipe.summary),
      })
      .select()
      .single()

    if (saveError) {
      return NextResponse.json({ error: '레시피 저장 중 오류가 발생했습니다.' }, { status: 500 })
    }

    revalidatePath('/')
    revalidatePath('/recipes')

    return NextResponse.json(saved)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'AI 레시피 생성에 실패했습니다.' }, { status: 500 })
  }
}
