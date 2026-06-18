'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Recipe } from '@/lib/supabase'
import { formatFragranceRateLabel } from '@/lib/fragrance-rate'

const GENDER_COLORS: Record<string, { bg: string; text: string }> = {
  남성: { bg: '#dbeafe', text: '#1e40af' },
  여성: { bg: '#fde0f0', text: '#9d174d' },
}

type Props = {
  recipe: Recipe
  selectionMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
}

export default function RecipeListCard({
  recipe,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: Props) {
  const noteColors = ['#c3faf5', '#fde0f0', '#ffe6cd']
  const genderColor = GENDER_COLORS[recipe.gender] ?? { bg: '#f3f4f6', text: '#374151' }

  const cardBody = (
    <motion.div
      whileHover={selectionMode ? undefined : { y: -2 }}
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        paddingLeft: selectionMode ? '44px' : '20px',
        border: selected ? '2px solid #1c1c1e' : '1px solid #eef0f3',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        boxShadow: 'rgba(5, 0, 56, 0.04) 0px 2px 8px 0px',
        height: '100%',
      }}
      onMouseEnter={
        selectionMode
          ? undefined
          : (e) => {
              e.currentTarget.style.boxShadow = 'rgba(5, 0, 56, 0.1) 0px 8px 24px -4px'
            }
      }
      onMouseLeave={
        selectionMode
          ? undefined
          : (e) => {
              e.currentTarget.style.boxShadow = 'rgba(5, 0, 56, 0.04) 0px 2px 8px 0px'
            }
      }
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h3
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#1c1c1e',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {recipe.name ?? '이름 없는 레시피'}
        </h3>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '9999px',
            background: genderColor.bg,
            color: genderColor.text,
            flexShrink: 0,
            marginLeft: '8px',
          }}
        >
          {recipe.gender}
        </span>
      </div>

      <p
        style={{
          fontSize: '13px',
          color: '#6b6f7e',
          margin: '0 0 14px',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {recipe.summary ?? '레시피 요약 없음'}
      </p>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {[
          { label: 'Top', notes: recipe.top_notes, color: noteColors[0] },
          { label: 'Mid', notes: recipe.middle_notes, color: noteColors[1] },
          { label: 'Base', notes: recipe.base_notes, color: noteColors[2] },
        ].map(({ label, notes, color }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '8px',
              background: color,
              fontSize: '12px',
            }}
          >
            <span style={{ fontWeight: 600, color: '#1c1c1e' }}>{label}</span>
            <span style={{ color: '#555a6a' }}>{notes?.length ?? 0}종</span>
          </div>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: '#8e91a0',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {formatFragranceRateLabel(recipe.fragrance_rate, recipe.fragrance_percent)}
        </div>
      </div>
    </motion.div>
  )

  if (selectionMode) {
    return (
      <div
        style={{ position: 'relative', height: '100%' }}
        onClick={() => onToggleSelect?.(recipe.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleSelect?.(recipe.id)
          }
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 2,
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            border: selected ? 'none' : '2px solid #c7cad5',
            background: selected ? '#1c1c1e' : '#ffffff',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            pointerEvents: 'none',
          }}
        >
          {selected ? '✓' : ''}
        </div>
        {cardBody}
      </div>
    )
  }

  return (
    <Link href={`/recipe/${recipe.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      {cardBody}
    </Link>
  )
}
