'use client'

import { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'
import Link from 'next/link'
import type { Recipe } from '@/lib/supabase'

type Props = {
  ingredientCount: number
  categoryCount: { top: number; middle: number; base: number; carrier: number }
  recipes: Recipe[]
}

function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })

    return () => controls.stop()
  }, [value, delay])

  return <>{display}</>
}

const FRAGRANCE_RATE_LABELS: Record<string, string> = {
  Parfum: '향수',
  'Eau de Parfum': '오드퍼퓸',
  'Eau de Toilette': '오드뚜왈렛',
  'Eau de Cologne': '오드콜로뉴',
}

const GENDER_COLORS: Record<string, { bg: string; text: string }> = {
  남성: { bg: '#dbeafe', text: '#1e40af' },
  여성: { bg: '#fde0f0', text: '#9d174d' },
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const noteColors = ['#c3faf5', '#fde0f0', '#ffe6cd']
  const genderColor = GENDER_COLORS[recipe.gender] ?? { bg: '#f3f4f6', text: '#374151' }

  return (
    <Link href={`/recipe/${recipe.id}`} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ y: -2 }}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #eef0f3',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
          boxShadow: 'rgba(5, 0, 56, 0.04) 0px 2px 8px 0px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'rgba(5, 0, 56, 0.1) 0px 8px 24px -4px'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'rgba(5, 0, 56, 0.04) 0px 2px 8px 0px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
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
            {recipe.fragrance_rate}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function DashboardClient({ ingredientCount, categoryCount, recipes }: Props) {
  const stats = [
    {
      label: '전체 재료',
      value: ingredientCount,
      unit: '종',
      color: '#f3f4f6',
      icon: '⬡',
    },
    {
      label: '생성된 레시피',
      value: recipes.length,
      unit: '개',
      color: '#fde0f0',
      icon: '✦',
    },
    {
      label: '탑 노트 재료',
      value: categoryCount.top,
      unit: '종',
      color: '#c3faf5',
      icon: '◈',
    },
    {
      label: '미들 노트 재료',
      value: categoryCount.middle,
      unit: '종',
      color: '#fde0f0',
      icon: '✦',
    },
    {
      label: '베이스 노트 재료',
      value: categoryCount.base,
      unit: '종',
      color: '#ffe6cd',
      icon: '◉',
    },
    {
      label: '베이스 용제',
      value: categoryCount.carrier,
      unit: '종',
      color: '#dbeafe',
      icon: '⬡',
    },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '32px' }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: '#1c1c1e',
            margin: '0 0 6px',
            letterSpacing: '-0.5px',
          }}
        >
          대시보드
        </h1>
        <p style={{ fontSize: '14px', color: '#8e91a0', margin: 0 }}>
          향수 레시피 스튜디오에 오신 것을 환영합니다
        </p>
      </motion.div>

      {/* 통계 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{
              background: stat.color,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontSize: '22px',
                marginBottom: '8px',
              }}
            >
              {stat.icon}
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#1c1c1e',
                lineHeight: 1,
                marginBottom: '4px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <AnimatedCounter value={stat.value} delay={i * 0.08 + 0.15} />
              <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '2px' }}>
                {stat.unit}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#555a6a', fontWeight: 500 }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 퀵 액션 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.4 }}
        style={{ marginBottom: '40px' }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#1c1c1e',
            margin: '0 0 16px',
          }}
        >
          빠른 시작
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/recipe/new" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 24px',
                background: '#1c1c1e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ✦ AI로 레시피 생성하기
            </motion.button>
          </Link>
          <Link href="/ingredients" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: '#1c1c1e',
                border: '1px solid #c7cad5',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ⬡ 재료 관리
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* 최근 레시피 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1c1c1e',
              margin: 0,
            }}
          >
            최근 레시피
          </h2>
        </div>

        {recipes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #eef0f3',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌸</div>
            <p style={{ fontSize: '15px', color: '#8e91a0', margin: 0 }}>
              아직 생성된 레시피가 없습니다
            </p>
            <p style={{ fontSize: '13px', color: '#a5a8b5', margin: '4px 0 0' }}>
              재료를 등록하고 첫 번째 레시피를 만들어보세요
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
