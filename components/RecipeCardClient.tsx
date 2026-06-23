'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Recipe, NoteItem } from '@/lib/supabase'
import { calcIngredientDosage, calcTotalDosage, calcAdditiveDosage, calcEthanolVolumeMl, calcOilVolumeMl, formatMl, DROPS_PER_ML } from '@/lib/recipe-dosage'
import { resolveAdditivePercent, getTotalAdditivePercent } from '@/lib/recipe-carrier'
import { formatFragranceRateLabel, getFragranceRateConfig } from '@/lib/fragrance-rate'

type Props = {
  recipe: Recipe
  oilTypeByName: Record<string, 'essential' | 'fragrance'>
}

const OIL_TYPE_MAP: Record<string, { label: string; color: string; textColor: string }> = {
  essential: { label: '에센셜', color: '#ecfdf5', textColor: '#047857' },
  fragrance: { label: '프래그런스', color: '#fef3c7', textColor: '#b45309' },
}

const NOTE_CONFIG = {
  top: {
    label: 'Top Note',
    sublabel: '탑 노트',
    color: '#c3faf5',
    textColor: '#187574',
    borderColor: '#0fbcb0',
    icon: '◈',
    desc: '처음 15-30분간 느껴지는 첫인상',
  },
  middle: {
    label: 'Middle Note',
    sublabel: '미들 노트',
    color: '#fde0f0',
    textColor: '#9d174d',
    borderColor: '#f687b3',
    icon: '✦',
    desc: '30분~수 시간 지속되는 핵심향',
  },
  base: {
    label: 'Base Note',
    sublabel: '베이스 노트',
    color: '#ffe6cd',
    textColor: '#92400e',
    borderColor: '#f6ad55',
    icon: '◉',
    desc: '수 시간~하루 지속되는 잔향',
  },
  carrier: {
    label: 'Additive',
    sublabel: '첨가제',
    color: '#dbeafe',
    textColor: '#1e40af',
    borderColor: '#60a5fa',
    icon: '⬡',
    desc: 'DPG·올리브 리퀴드 등 (에탄올과 별도, 소량 첨가)',
  },
  ethanol: {
    label: 'Ethanol',
    sublabel: '에탄올',
    color: '#f3f4f6',
    textColor: '#374151',
    borderColor: '#d1d5db',
    icon: '◎',
    desc: '주용 희석제 — 나머지 용량을 채웁니다',
  },
}

const GENDER_BADGE: Record<string, { bg: string; text: string }> = {
  남성: { bg: '#dbeafe', text: '#1e40af' },
  여성: { bg: '#fde0f0', text: '#9d174d' },
}

function DosageBadges({
  ml,
  dropsLabel,
  accentColor,
  accentBg,
}: {
  ml: number
  dropsLabel: string
  accentColor: string
  accentBg: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: accentColor,
          background: accentBg,
          padding: '2px 8px',
          borderRadius: '6px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatMl(ml)}ml
      </span>
      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#555a6a',
          background: '#f0f1f5',
          padding: '2px 8px',
          borderRadius: '6px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {dropsLabel}방울
      </span>
    </div>
  )
}

function NoteCard({
  type,
  notes,
  delay,
  volumeMl,
  fragranceRate,
  fragrancePercent,
  oilTypeByName,
}: {
  type: 'top' | 'middle' | 'base'
  notes: NoteItem[]
  delay: number
  volumeMl: number
  fragranceRate: string
  fragrancePercent?: number | null
  oilTypeByName: Record<string, 'essential' | 'fragrance'>
}) {
  const config = NOTE_CONFIG[type]
  const sectionDosage = calcTotalDosage(notes, volumeMl, fragranceRate, fragrancePercent)
  const sectionTotalMl = sectionDosage.totalMl

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #eef0f3',
        boxShadow: 'rgba(5, 0, 56, 0.04) 0px 4px 12px 0px',
      }}
    >
      {/* 카드 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #eef0f3',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}
        >
          {config.icon}
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: config.textColor, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {config.label}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1c1c1e' }}>
            {config.sublabel}
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 700, color: config.textColor, fontVariantNumeric: 'tabular-nums' }}>
            {formatMl(sectionTotalMl)}ml
          </div>
          <div style={{ fontSize: '12px', color: '#8e91a0', fontVariantNumeric: 'tabular-nums' }}>
            {sectionDosage.totalDrops}방울
          </div>
        </div>
      </div>
      <p style={{ fontSize: '12px', color: '#8e91a0', margin: '0 0 16px' }}>{config.desc}</p>

      {/* 재료 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notes.map((note, i) => {
          const dosage = calcIngredientDosage(note.ratio, volumeMl, fragranceRate, fragrancePercent)
          const oilType = note.oil_type ?? oilTypeByName[note.name]
          const oilBadge = oilType ? OIL_TYPE_MAP[oilType] : null

          return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.06, duration: 0.4 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1c1e' }}>
                  {note.name}
                </span>
                {oilBadge && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      background: oilBadge.color,
                      color: oilBadge.textColor,
                      flexShrink: 0,
                    }}
                  >
                    {oilBadge.label}
                  </span>
                )}
              </div>
              <DosageBadges
                ml={dosage.ml}
                dropsLabel={dosage.dropsLabel}
                accentColor={config.textColor}
                accentBg={config.color}
              />
            </div>
            {/* 비율 바 */}
            <div
              style={{
                height: '4px',
                background: '#f0f1f5',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: '4px',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: sectionTotalMl > 0 ? `${(dosage.ml / sectionTotalMl) * 100}%` : '0%',
                }}
                transition={{ delay: delay + 0.3 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: config.borderColor,
                  borderRadius: '2px',
                }}
              />
            </div>
            {note.description && (
              <p style={{ fontSize: '12px', color: '#8e91a0', margin: 0, lineHeight: 1.5 }}>
                {note.description}
              </p>
            )}
          </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function AdditiveCard({
  notes,
  delay,
  volumeMl,
}: {
  notes: NoteItem[]
  delay: number
  volumeMl: number
}) {
  const config = NOTE_CONFIG.carrier
  const additivePercent = resolveAdditivePercent(notes)
  const isLegacySingle = notes.length === 1 && getTotalAdditivePercent(notes) >= 50
  const additiveItems = notes.map((note) => {
    const displayPercent = isLegacySingle ? additivePercent : note.ratio
    return { note, dosage: calcAdditiveDosage(displayPercent, volumeMl) }
  })
  const additiveTotalMl = additiveItems.reduce((sum, item) => sum + item.dosage.ml, 0)
  const additiveTotalDrops = additiveItems.reduce((sum, item) => sum + item.dosage.drops, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #eef0f3',
        boxShadow: 'rgba(5, 0, 56, 0.04) 0px 4px 12px 0px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #eef0f3',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}
        >
          {config.icon}
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: config.textColor, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {config.label}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1c1c1e' }}>
            {config.sublabel}
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 700, color: config.textColor, fontVariantNumeric: 'tabular-nums' }}>
            {formatMl(additiveTotalMl)}ml
          </div>
          <div style={{ fontSize: '12px', color: '#8e91a0', fontVariantNumeric: 'tabular-nums' }}>
            {additiveTotalDrops}방울
          </div>
        </div>
      </div>
      <p style={{ fontSize: '12px', color: '#8e91a0', margin: '0 0 16px' }}>{config.desc}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {additiveItems.map(({ note, dosage }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + i * 0.06, duration: 0.4 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1c1e' }}>
                  {note.name}
                </span>
                <DosageBadges
                  ml={dosage.ml}
                  dropsLabel={dosage.dropsLabel}
                  accentColor={config.textColor}
                  accentBg={config.color}
                />
              </div>
              {note.description && (
                <p style={{ fontSize: '12px', color: '#8e91a0', margin: 0, lineHeight: 1.5 }}>
                  {note.description}
                </p>
              )}
            </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function EthanolCard({
  volumeMl,
  fragranceRate,
  fragrancePercent,
  additivePercent,
  delay,
  agingGuide,
}: {
  volumeMl: number
  fragranceRate: string
  fragrancePercent?: number | null
  additivePercent: number
  delay: number
  agingGuide?: string
}) {
  const config = NOTE_CONFIG.ethanol
  const ethanolMl = calcEthanolVolumeMl(
    volumeMl,
    fragranceRate,
    fragrancePercent,
    additivePercent
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #eef0f3',
        boxShadow: 'rgba(5, 0, 56, 0.04) 0px 4px 12px 0px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid #eef0f3',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}
        >
          {config.icon}
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: config.textColor, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {config.label}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1c1c1e' }}>
            {config.sublabel}
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 700, color: config.textColor, fontVariantNumeric: 'tabular-nums' }}>
            {formatMl(ethanolMl)}ml
          </div>
        </div>
      </div>
      <p style={{ fontSize: '12px', color: '#8e91a0', margin: 0, lineHeight: 1.5 }}>
        {config.desc}
        {agingGuide ? ` · ${agingGuide.split(' / ')[0]}` : ''}
      </p>
    </motion.div>
  )
}

export default function RecipeCardClient({ recipe, oilTypeByName }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const genderBadge = GENDER_BADGE[recipe.gender] ?? { bg: '#f3f4f6', text: '#374151' }

  async function handleDelete() {
    if (!confirm('이 레시피를 삭제하시겠습니까?')) return
    setDeleting(true)
    await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  const formattedDate = new Date(recipe.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const allNotes = [...recipe.top_notes, ...recipe.middle_notes, ...recipe.base_notes]
  const totalDosage = calcTotalDosage(
    allNotes,
    recipe.volume,
    recipe.fragrance_rate,
    recipe.fragrance_percent
  )
  const totalOilMl = calcOilVolumeMl(
    recipe.volume,
    recipe.fragrance_rate,
    recipe.fragrance_percent
  )
  const rateConfig = getFragranceRateConfig(recipe.fragrance_rate)
  const carrierNotes = recipe.carrier_notes ?? []
  const additivePercent = resolveAdditivePercent(carrierNotes)
  const additiveTotalMl = carrierNotes.reduce(
    (sum, note) => sum + calcAdditiveDosage(note.ratio, recipe.volume).ml,
    0
  )
  const ethanolMl = calcEthanolVolumeMl(
    recipe.volume,
    recipe.fragrance_rate,
    recipe.fragrance_percent,
    additivePercent
  )

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      {/* 뒤로 가기 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => router.back()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: '#6b6f7e',
          fontSize: '14px',
          cursor: 'pointer',
          padding: '0',
          marginBottom: '24px',
        }}
      >
        ← 뒤로가기
      </motion.button>

      {/* 레시피 헤더 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: '#1c1c1e',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 장식 */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255,208,47,0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '20%',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'rgba(195,250,245,0.06)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              🌸 향수 레시피
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.5px',
                lineHeight: 1.3,
              }}
            >
              {recipe.name ?? '이름 없는 레시피'}
            </h1>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '9999px',
              fontSize: '13px',
              cursor: deleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>

        {/* 태그 행 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              background: genderBadge.bg,
              color: genderBadge.text,
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {recipe.gender}
          </span>
          <span
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              background: 'rgba(255,208,47,0.15)',
              color: '#ffd02f',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {formatFragranceRateLabel(recipe.fragrance_rate, recipe.fragrance_percent)}
          </span>
          <span
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {recipe.volume}ml
          </span>
          {recipe.mbti && (
            <span
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                background: 'rgba(195,250,245,0.15)',
                color: '#c3faf5',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {recipe.mbti}
            </span>
          )}
          {recipe.enneagram && recipe.enneagram.length > 0 && (
            <span
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                background: 'rgba(253,224,240,0.15)',
                color: '#fde0f0',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              에니어그램 {recipe.enneagram.join(', ')}번
            </span>
          )}
        </div>

        {/* 요약 */}
        {recipe.summary && (
          <p
            style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              margin: '0 0 20px',
            }}
          >
            {recipe.summary}
          </p>
        )}

        {/* 노트 구성 */}
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 500 }}>
            노트 구성 (원료 오일 {formatMl(totalOilMl)}ml)
          </div>
          <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', gap: '2px' }}>
            {[
              { notes: recipe.top_notes, color: '#0fbcb0' },
              { notes: recipe.middle_notes, color: '#f687b3' },
              { notes: recipe.base_notes, color: '#f6ad55' },
            ].map(({ notes, color }, i) => {
              const sectionMl = calcTotalDosage(
                notes,
                recipe.volume,
                recipe.fragrance_rate,
                recipe.fragrance_percent
              ).totalMl
              return (
                <motion.div
                  key={i}
                  initial={{ flex: 0 }}
                  animate={{ flex: Math.max(sectionMl, 0.001) }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  style={{ background: color, borderRadius: '2px' }}
                />
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Top', notes: recipe.top_notes, color: '#0fbcb0' },
              { label: 'Middle', notes: recipe.middle_notes, color: '#f687b3' },
              { label: 'Base', notes: recipe.base_notes, color: '#f6ad55' },
            ].map(({ label, notes, color }) => {
              const section = calcTotalDosage(
                notes,
                recipe.volume,
                recipe.fragrance_rate,
                recipe.fragrance_percent
              )
              return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {formatMl(section.totalMl)}ml · {section.totalDrops}방울
                </span>
              </div>
              )
            })}
          </div>
        </div>

        {recipe.special_notes && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '10px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>특이사항: </span>
            {recipe.special_notes}
          </div>
        )}

        <div
          style={{
            marginTop: '16px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {formattedDate} 생성
        </div>
      </motion.div>

      {/* 노트 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        <NoteCard type="top" notes={recipe.top_notes} delay={0.2} volumeMl={recipe.volume} fragranceRate={recipe.fragrance_rate} fragrancePercent={recipe.fragrance_percent} oilTypeByName={oilTypeByName} />
        <NoteCard type="middle" notes={recipe.middle_notes} delay={0.3} volumeMl={recipe.volume} fragranceRate={recipe.fragrance_rate} fragrancePercent={recipe.fragrance_percent} oilTypeByName={oilTypeByName} />
        <NoteCard type="base" notes={recipe.base_notes} delay={0.4} volumeMl={recipe.volume} fragranceRate={recipe.fragrance_rate} fragrancePercent={recipe.fragrance_percent} oilTypeByName={oilTypeByName} />
        {carrierNotes.length > 0 && (
          <AdditiveCard
            notes={carrierNotes}
            delay={0.5}
            volumeMl={recipe.volume}
          />
        )}
        <EthanolCard
          volumeMl={recipe.volume}
          fragranceRate={recipe.fragrance_rate}
          fragrancePercent={recipe.fragrance_percent}
          additivePercent={additivePercent}
          delay={carrierNotes.length > 0 ? 0.55 : 0.5}
          agingGuide={rateConfig?.agingGuide}
        />
      </div>

      {/* 사용법 가이드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        style={{
          marginTop: '20px',
          background: '#fff8e0',
          borderRadius: '16px',
          padding: '20px 24px',
          border: '1px solid #ffd02f44',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>
          ✦ 제조 안내
        </div>
        <p style={{ fontSize: '13px', color: '#92400e', margin: '0 0 10px', lineHeight: 1.7 }}>
          {recipe.volume}ml 기준 · 원료 오일 {formatMl(totalOilMl)}ml · 합계 {totalDosage.totalDrops}방울
          {carrierNotes.length > 0 && (
            <> · 첨가제 {formatMl(additiveTotalMl)}ml</>
          )}
          <> · 에탄올 {formatMl(ethanolMl)}ml</>
          <span style={{ color: '#b45309', fontSize: '12px' }}> · 1ml = {DROPS_PER_ML}방울</span>
        </p>
        <p style={{ fontSize: '13px', color: '#92400e', margin: 0, lineHeight: 1.7 }}>
          {rateConfig
            ? rateConfig.agingGuide.split(' / ').slice(1).join(' / ') || rateConfig.agingGuide
            : '숙성 안내 없음'}
        </p>
      </motion.div>
    </div>
  )
}
