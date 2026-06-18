const MBTI_PROFILES: Record<string, string> = {
  INTJ: '전략적·지적·절제된 향. 우디·아로마틱·스파이시 계열, 깔끔하고 구조적인 조합, 과한 달콤함 지양',
  INTP: '독창적·탐구형 향. 흔하지 않은 허브·레진·미네랄 계열, 실험적이되 정돈된 조합',
  ENTJ: '카리스마·리더십. 강렬한 스파이시·우디·앰버, 존재감 있는 베이스, 자신감 있는 구조',
  ENTP: '역동적·자극적. 시트러스·스파이시·아로마틱 대비, 변주가 있는 활기찬 조합',
  INFJ: '신비·깊이·직관. 부드러운 플로럴·우디·머스크, 은은하지만 잔향이 긴 조합',
  INFP: '감성·개성·낭만. 아이리스·바이올렛·소프트 플로럴, 독특하고 서사적인 향',
  ENFJ: '따뜻·매력·조화. 플로럴·프루티·머스크, 사람을 편안하게 하는 밝은 중심향',
  ENFP: '자유·열정·다채로움. 프루티·플로럴·시트러스 믹스, 밝고 표현력 있는 조합',
  ISTJ: '신뢰·단정·클래식. 클린·우디·코ologne 스타일, 무난하지만 품격 있는 전통적 구조',
  ISFJ: '온화·헌신·편안함. 파우더리·플로럴·머스크, 부드럽고 포근한 잔향',
  ESTJ: '실용·명확·강인. 아로마틱·시트러스·우디, 깔끔하고 정돈된 남성적/중성적 구조',
  ESFJ: '친근·밝음·사교. 프루티·플로럴·바닐라, 대중적이되 세련된 매력',
  ISTP: '쿨·미니멀·감각. 시트러스·우디·스모키, 간결하고 날카로운 첫인상',
  ISFP: '예술·감각·자연. 그린·플로럴·우디, 부드럽고 자연스러운 조화',
  ESTP: '에너지·대담·즉흥. 시트러스·스파이시·아쿠아틱, 상쾌하고 자극적인 탑 노트',
  ESFP: '즐거움·화려·현재. 프루티·플로럴·시트러스, 밝고 사랑스러운 조합',
}

const ENNEAGRAM_PROFILES: Record<number, string> = {
  1: '1번(개혁가): 정돈·완벽·청결. 그린·허브·클린 계열, 균형 잡히고 절제된 비율',
  2: '2번(조력가): 따뜻·배려·매력. 플로럴·머스크·바닐라, 포근하고 사람을 끌어당기는 향',
  3: '3번(성취자): 성공·이미지·자신감. 세련·대담·기억에 남는, 존재감 있는 조합',
  4: '4번(예술가): 독특·깊은 감정·개성. 희귀한 노트·대비·낭만적이고 예술적인 조합',
  5: '5번(탐구자): 지적·거리·절제. 우디·베티버·시더, 미니멀하고 관찰자적인 향',
  6: '6번(충성가): 안정·신뢰·편안. 익숙한 플로럴·우디·머스크, 안정감 있는 클래식 구조',
  7: '7번(열정가): 즐거움·모험·다양. 시트러스·프루티·스파이시, 밝고 변화무쌍한 조합',
  8: '8번(도전자): 힘·카리스마·직설. 스파이시·우디·레더·앰버, 강렬하고 압도적인 베이스',
  9: '9번(평화주의자): 조화·평온·수용. 소프트 플로럴·머스크·우디, 부드럽고 갈등 없는 조합',
}

const ENNEAGRAM_NAMES: Record<number, string> = {
  1: '개혁가',
  2: '조력가',
  3: '성취자',
  4: '예술가',
  5: '탐구자',
  6: '충성가',
  7: '열정가',
  8: '도전자',
  9: '평화주의자',
}

const GENDER_PROFILES: Record<string, string> = {
  남성: '남성 고객: 우디·아로마틱·스파이시·시트러스 계열을 우선 고려하되, 성격 유형(MBTI·에니어그램)이 플로럴/소프트 계열을 지향하면 그에 맞게 조정. 무뚝뚝한 고정식 남성향에 갇히지 말 것',
  여성: '여성 고객: 플로럴·프루티·머스크·파우더리 계열을 우선 고려하되, 성격 유형이 강렬·우디·스파이시를 지향하면 그에 맞게 조정. 지나치게 달콤한 고정식 여성향에 갇히지 말 것',
}

export function buildPersonalityPromptSection(
  gender: string,
  mbti?: string,
  enneagram?: number[]
): string {
  const lines = [
    '## 성향 분석 기반 조향 (최우선 — 반드시 이 분석을 먼저 수행한 뒤 재료를 선택하세요)',
    '',
    '### 1단계: 고객 성향 종합 분석',
    '아래 성별·MBTI·에니어그램을 종합해 이 사람의 향 취향 프로필을 먼저 도출하세요.',
    '- 어떤 향 가족(citrus, floral, woody, spicy, aromatic, gourmand, musky)에 끌리는가',
    '- 첫인상(탑)·핵심(미들)·잔향(베이스)에 각각 어떤 무드가 어울리는가',
    '- 피해야 할 향 방향 (성향과 충돌하는 요소)',
    '',
    '### 고객 프로필',
    `- **성별**: ${gender}`,
    `  → ${GENDER_PROFILES[gender] ?? gender}`,
  ]

  if (mbti && MBTI_PROFILES[mbti]) {
    lines.push(`- **MBTI ${mbti}**: ${MBTI_PROFILES[mbti]}`)
  } else if (mbti) {
    lines.push(`- **MBTI ${mbti}**: 4가지 선호(E/I, S/N, T/F, J/P)를 각각 향 선호에 매핑해 분석`)
  } else {
    lines.push('- **MBTI**: 미입력 — 성별과 에니어그램만으로 분석')
  }

  if (Array.isArray(enneagram) && enneagram.length > 0) {
    for (const type of enneagram) {
      const profile = ENNEAGRAM_PROFILES[type]
      const typeName = ENNEAGRAM_NAMES[type]
      if (profile) {
        lines.push(`- **에니어그램 ${type}번(${typeName})**: ${profile}`)
      }
    }
    if (enneagram.length > 1) {
      lines.push(
        `- 복수 에니어그램(${enneagram.join(', ')}번)의 공통점과 긴장 관계를 모두 반영해 균형 잡힌 조합을 만드세요`
      )
    }
  } else {
    lines.push('- **에니어그램**: 미입력 — 성별과 MBTI만으로 분석')
  }

  lines.push(
    '',
    '### 2단계: 성향 → 재료 매핑 (필수)',
    '- 1단계 분석 결과와 **직접 연결되는** 재료만 선택하세요',
    '- 각 재료의 description에는 "왜 이 고객의 성별/MBTI/에니어그램에 맞는지"를 구체적으로 설명하세요 (예: "INFP의 낭만적 성향에 어울리는 아이리스의 서사적 잔향")',
    '- personality_analysis와 summary에도 성향 분석 결과가 드러나야 합니다',
    '- 다양성 지침과 충돌할 경우 **성향 분석을 우선**하세요',
    '',
    '### 3단계: 노트 구조 설계',
    '- **탑 노트**: 이 사람의 첫인상·대외적 persona (성별 + E/I, 3번/7번/8번 등 반영)',
    '- **미들 노트**: 핵심 성격·감정 (MBTI NF/NT/SF/ST, 에니어그램 핵심 motiv)',
    '- **베이스 노트**: 내면·잔향·지속되는 인상 (에니어그램 방어기제, J/P, 남/여 성향의 깊은 층)',
  )

  return lines.join('\n')
}

export function mergeRecipeSummary(personalityAnalysis?: string, summary?: string): string | null {
  const parts = [personalityAnalysis?.trim(), summary?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join('\n\n') : null
}
