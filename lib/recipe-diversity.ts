import { getNoteLayers, type NoteLayer } from '@/lib/ingredients'
import type { Ingredient, NoteItem } from '@/lib/supabase'

type RecentRecipe = {
  name?: string | null
  top_notes: NoteItem[]
  middle_notes: NoteItem[]
  base_notes: NoteItem[]
}

const TITLE_STYLE_DIRECTIONS = [
  {
    style: '재료 중심',
    guide: '핵심 재료 1~2개를 담담하게 (예: "Basil & Lime", "Cedar Cardamom")',
    examples: ['Green Tea Leaf', 'Rosewood Ginger'],
  },
  {
    style: '무드·장면',
    guide: '향이 떠오르는 일상 장면·분위기 (예: "Rainy Window", "Late Bus Ride", "Open Window")',
    examples: ['Quiet Corner', 'Warm Laundry'],
  },
  {
    style: '감각·색',
    guide: '촉감·온도·색으로 표현 (예: "Soft Grey", "Cool Mint Air", "Golden Hour")',
    examples: ['Pale Blue', 'Warm Sand'],
  },
  {
    style: '캐주얼·솔직',
    guide: '꾸미지 않은 가벼운 말투 (예: "Almost Sweet", "Not Too Loud", "Still Awake")',
    examples: ['Kind of Fresh', 'Half Asleep'],
  },
  {
    style: '짧고 단순',
    guide: '1~2단어, 군더더기 없이 (예: "Woodsmoke", "Petal", "Drift")',
    examples: ['Haze', 'Porchlight'],
  },
  {
    style: '시·이미지',
    guide: '은유·짧은 구절 (예: "Paper Moon", "Salt on Skin", "First Snow")',
    examples: ['Empty Cup', 'Slow River'],
  },
  {
    style: '시간·계절',
    guide: '시간대·계절감 (예: "March Morning", "3am Kitchen", "Early Autumn")',
    examples: ['Sunday Noon', 'Winter Walk'],
  },
  {
    style: '유머·엣지',
    guide: '약간의 위트·의외성 (예: "Borrowed Jacket", "Misplaced Umbrella", "Too Many Books")',
    examples: ['Lost Key', 'Extra Sugar'],
  },
]

const OVERUSED_TITLE_WORDS = [
  'essence',
  'elixir',
  'velvet',
  'noir',
  'lumière',
  'lumiere',
  'mystique',
  'elegance',
  'supreme',
  'royal',
  'lux',
  'luxury',
  'prestige',
  'signature',
  'parfum',
  'accord',
  'aura',
  'divine',
  'enigma',
]

const CREATIVE_DIRECTIONS = [
  '플로럴·그린 계열 중심의 가볍고 상쾌한 조합',
  '우디·스파이시 계열로 깊고 세련된 조합',
  '시트러스 탑과 따뜻한 베이스의 대비 있는 조합',
  '허벌·아로마틱 계열의 자연스럽고 청량한 조합',
  '플로럴·프루티 계열의 부드럽고 로맨틱한 조합',
  '머스크·앰버·바닐라 계열의 포근하고 sensual한 조합',
  '스모키·레진·우디 계열의 묵직하고 개성 있는 조합',
  '민트·허브·시트러스의 활기찬 조합',
]

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function collectRecipeIngredientNames(recipe: RecentRecipe): string[] {
  return [...recipe.top_notes, ...recipe.middle_notes, ...recipe.base_notes].map(
    (note) => note.name
  )
}

export function countIngredientUsage(recentRecipes: RecentRecipe[]): Map<string, number> {
  const counts = new Map<string, number>()

  for (const recipe of recentRecipes) {
    for (const name of new Set(collectRecipeIngredientNames(recipe))) {
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  }

  return counts
}

export function pickCreativeDirection(): string {
  return CREATIVE_DIRECTIONS[Math.floor(Math.random() * CREATIVE_DIRECTIONS.length)]
}

export function getOverusedIngredients(
  usageCounts: Map<string, number>,
  recentRecipeCount: number
): string[] {
  if (recentRecipeCount === 0) return []

  const threshold = Math.max(2, Math.ceil(recentRecipeCount * 0.35))
  return [...usageCounts.entries()]
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
}

export function pickSpotlightIngredients(
  ingredients: Ingredient[],
  usageCounts: Map<string, number>,
  recentRecipeCount: number
): string[] {
  const fragranceIngredients = ingredients.filter((i) => i.category !== 'carrier')
  const scored = fragranceIngredients.map((ingredient) => {
    const count = usageCounts.get(ingredient.name) ?? 0
    let score = 0

    if (recentRecipeCount === 0) {
      score = 1
    } else if (count === 0) {
      score = 4
    } else if (count === 1) {
      score = 3
    } else if (count === 2) {
      score = 2
    } else {
      score = 0
    }

    return { ingredient, score, layers: getNoteLayers(ingredient) }
  })

  const picked: string[] = []
  const layers: NoteLayer[] = ['top', 'middle', 'base']

  for (const layer of layers) {
    const candidates = shuffle(
      scored.filter((item) => item.score > 0 && item.layers.includes(layer))
    )

    for (const candidate of candidates.slice(0, 2)) {
      if (!picked.includes(candidate.ingredient.name)) {
        picked.push(candidate.ingredient.name)
      }
    }
  }

  const remaining = shuffle(scored.filter((item) => item.score > 0))
  for (const candidate of remaining) {
    if (picked.length >= 5) break
    if (!picked.includes(candidate.ingredient.name)) {
      picked.push(candidate.ingredient.name)
    }
  }

  return picked.slice(0, 5)
}

export function shuffleIngredientsList<T>(items: T[]): T[] {
  return shuffle(items)
}

export function pickTitleStyleDirection() {
  return TITLE_STYLE_DIRECTIONS[Math.floor(Math.random() * TITLE_STYLE_DIRECTIONS.length)]
}

export function buildNamingPromptSection(recentRecipes: RecentRecipe[]): string {
  const direction = pickTitleStyleDirection()
  const recentNames = recentRecipes
    .map((recipe) => recipe.name?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, 10)

  const lines = [
    '## 향수 제목 (name) 지침',
    '- **고급·럭셔리 향수 브랜드명처럼 짓지 마세요.** Essence, Elixir, Velvet Noir, Mystique, Elegance 같은 뻔한 마케팅 단어는 피하세요.',
    `- 이번 제목 스타일: **${direction.style}** — ${direction.guide}`,
    `- 참고 톤 (그대로 복사 금지): ${direction.examples.join(', ')}`,
    '- 1~4단어, 영어, 이번 레시피의 재료·무드·성향과 연결되되 **매번 다른 느낌**으로',
    '- 직전 레시피들과 비슷한 단어 조합·리듬 반복 금지',
  ]

  if (recentNames.length > 0) {
    lines.push(`- 최근 사용된 제목 (유사하게 짓지 마세요): ${recentNames.join(' / ')}`)
  }

  lines.push(`- 피할 단어 예: ${OVERUSED_TITLE_WORDS.slice(0, 12).join(', ')}`)

  return lines.join('\n')
}

export function buildDiversityPromptSection(
  recentRecipes: RecentRecipe[],
  ingredients: Ingredient[]
): string {
  const usageCounts = countIngredientUsage(recentRecipes)
  const recentCount = recentRecipes.length
  const overused = getOverusedIngredients(usageCounts, recentCount)
  const spotlight = pickSpotlightIngredients(ingredients, usageCounts, recentCount)
  const creativeDirection = pickCreativeDirection()

  const neverUsed = ingredients
    .filter((i) => i.category !== 'carrier' && !usageCounts.has(i.name))
    .map((i) => i.name)

  const lines = [
    '## 다양성 지침 (반드시 준수)',
    `- 이번 레시피의 창의적 방향: **${creativeDirection}**`,
    '- 매번 다른 향 가족과 조합을 시도하세요. "안전한" 고정 조합(자주 쓰이는 베이스+탑 페어링)을 반복하지 마세요.',
    '- 등록된 재료 풀 전체를 골고루 활용하세요. 항상 같은 재료만 선택하지 마세요.',
  ]

  if (spotlight.length > 0) {
    lines.push(
      `- 이번 레시피에 **최소 ${Math.min(3, spotlight.length)}개 이상** 반드시 포함할 재료: ${spotlight.join(', ')}`
    )
  }

  if (overused.length > 0) {
    lines.push(
      `- 최근 레시피에서 과다 사용된 재료 (가능하면 제외, 부득이하면 1개 이하만 사용): ${overused.join(', ')}`
    )
  }

  if (neverUsed.length > 0 && neverUsed.length <= 12) {
    lines.push(`- 최근 레시피에 한 번도 쓰이지 않은 재료 (적극 활용 권장): ${neverUsed.join(', ')}`)
  } else if (neverUsed.length > 12) {
    lines.push(
      `- 최근 레시피에 한 번도 쓰이지 않은 재료가 ${neverUsed.length}종 있습니다. 이 중에서 최소 2개 이상 포함하세요.`
    )
  }

  if (recentCount > 0) {
    const lastRecipe = recentRecipes[0]
    const lastNames = [...new Set(collectRecipeIngredientNames(lastRecipe))]
    lines.push(
      `- 직전 레시피와 **50% 이상 다른 재료**를 사용하세요. 직전 레시피 재료: ${lastNames.join(', ')}`
    )
  }

  return lines.join('\n')
}
