'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FRAGRANCE_RATE_OPTIONS,
  getFragranceRateConfig,
} from '@/lib/fragrance-rate'

const GENDERS = ['남성', '여성']

const MBTI_OPTIONS = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]

const VOLUMES = [10, 30, 50, 100]

type FormState = {
  gender: string
  fragrance_rate: string
  fragrance_percent: number | null
  volume: string
  mbti: string
  enneagram: number[]
  special_notes: string
}

const INITIAL_FORM: FormState = {
  gender: '',
  fragrance_rate: '',
  fragrance_percent: null,
  volume: '50',
  mbti: '',
  enneagram: [],
  special_notes: '',
}

function parseVolume(value: string): number | null {
  if (value === '') return null
  const parsed = parseInt(value, 10)
  if (Number.isNaN(parsed)) return null
  return parsed
}

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 18px',
        borderRadius: '9999px',
        border: selected ? 'none' : '1px solid #c7cad5',
        background: selected ? '#1c1c1e' : 'transparent',
        color: selected ? '#ffffff' : '#555a6a',
        fontSize: '14px',
        fontWeight: selected ? 500 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  )
}

export default function RecipeGeneratorClient() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const parsedVolume = parseVolume(form.volume)
  const rateConfig = getFragranceRateConfig(form.fragrance_rate)
  const isFormValid =
    form.gender &&
    form.fragrance_rate &&
    form.fragrance_percent !== null &&
    rateConfig !== undefined &&
    form.fragrance_percent >= rateConfig.min &&
    form.fragrance_percent <= rateConfig.max &&
    parsedVolume !== null &&
    parsedVolume >= 1 &&
    parsedVolume <= 500

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid || parsedVolume === null) return
    setError('')
    setGenerating(true)

    try {
      const res = await fetch('/api/recipe/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: form.gender,
          fragrance_rate: form.fragrance_rate,
          fragrance_percent: form.fragrance_percent,
          volume: parsedVolume,
          mbti: form.mbti || undefined,
          enneagram: form.enneagram.length > 0 ? form.enneagram : undefined,
          special_notes: form.special_notes || undefined,
        }),
      })

      if (res.ok) {
        const recipe = await res.json()
        router.refresh()
        router.push(`/recipe/${recipe.id}`)
      } else {
        const data = await res.json()
        setError(data.error ?? 'AI 레시피 생성에 실패했습니다.')
      }
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const sectionStyle = {
    marginBottom: '28px',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '14px',
    fontWeight: 600,
    color: '#1c1c1e',
    marginBottom: '12px',
  }

  return (
    <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto' }}>
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '9999px',
              background: '#ffd02f',
              color: '#1c1c1e',
              letterSpacing: '0.3px',
            }}
          >
            AI
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#1c1c1e',
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            레시피 생성
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: '#8e91a0', margin: 0 }}>
          고객 정보를 입력하면 AI가 맞춤형 향수 레시피를 제안해드립니다
        </p>
      </motion.div>

      <form onSubmit={handleGenerate}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '28px',
            border: '1px solid #eef0f3',
            boxShadow: 'rgba(5, 0, 56, 0.04) 0px 4px 12px 0px',
          }}
        >
          {/* 성별 */}
          <div style={sectionStyle}>
            <label style={labelStyle}>
              성별 <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {GENDERS.map((g) => (
                <OptionButton
                  key={g}
                  selected={form.gender === g}
                  onClick={() => setForm((p) => ({ ...p, gender: g }))}
                >
                  {g}
                </OptionButton>
              ))}
            </div>
          </div>

          {/* 부향률 */}
          <div style={sectionStyle}>
            <label style={labelStyle}>
              부향률 <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FRAGRANCE_RATE_OPTIONS.map((fr) => (
                <button
                  key={fr.value}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      fragrance_rate: fr.value,
                      fragrance_percent: fr.defaultPercent,
                    }))
                  }
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border:
                      form.fragrance_rate === fr.value
                        ? '2px solid #1c1c1e'
                        : '1px solid #e0e2e8',
                    background:
                      form.fragrance_rate === fr.value ? '#1c1c1e' : '#ffffff',
                    color: form.fragrance_rate === fr.value ? '#ffffff' : '#1c1c1e',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{fr.label}</div>
                  <div
                    style={{
                      fontSize: '12px',
                      color:
                        form.fragrance_rate === fr.value ? 'rgba(255,255,255,0.7)' : '#8e91a0',
                      marginTop: '2px',
                    }}
                  >
                    {fr.sub}
                  </div>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {rateConfig && form.fragrance_percent !== null && (
                <motion.div
                  key={form.fragrance_rate}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden', marginTop: '16px' }}
                >
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: '#f8f9fb',
                      border: '1px solid #eef0f3',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1c1c1e' }}>
                        원료 오일 농도
                      </span>
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#1c1c1e',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {form.fragrance_percent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={rateConfig.min}
                      max={rateConfig.max}
                      step={1}
                      value={form.fragrance_percent}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          fragrance_percent: Number(e.target.value),
                        }))
                      }
                      style={{
                        width: '100%',
                        height: '6px',
                        accentColor: '#1c1c1e',
                        cursor: 'pointer',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#8e91a0',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <span>{rateConfig.min}%</span>
                      <span>{rateConfig.max}%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 용량 */}
          <div style={sectionStyle}>
            <label style={labelStyle}>
              향수 용량 <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {VOLUMES.map((v) => (
                <OptionButton
                  key={v}
                  selected={form.volume === String(v)}
                  onClick={() => setForm((p) => ({ ...p, volume: String(v) }))}
                >
                  {v}ml
                </OptionButton>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#8e91a0' }}>직접 입력:</span>
              <input
                type="number"
                min={1}
                max={500}
                value={form.volume}
                onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))}
                style={{
                  width: '80px',
                  height: '36px',
                  padding: '0 10px',
                  border: '1px solid #c7cad5',
                  borderRadius: '9px',
                  outline: 'none',
                  fontSize: '16px',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '13px', color: '#8e91a0' }}>ml</span>
            </div>
          </div>

          {/* MBTI */}
          <div style={sectionStyle}>
            <label style={labelStyle}>
              MBTI
              <span style={{ fontSize: '12px', fontWeight: 400, color: '#8e91a0', marginLeft: '8px' }}>
                (선택사항)
              </span>
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {MBTI_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, mbti: p.mbti === m ? '' : m }))}
                  style={{
                    width: '60px',
                    height: '36px',
                    borderRadius: '8px',
                    border: form.mbti === m ? 'none' : '1px solid #e0e2e8',
                    background: form.mbti === m ? '#1c1c1e' : 'transparent',
                    color: form.mbti === m ? '#ffffff' : '#555a6a',
                    fontSize: '13px',
                    fontWeight: form.mbti === m ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 에니어그램 */}
          <div style={sectionStyle}>
            <label style={labelStyle}>
              에니어그램
              <span style={{ fontSize: '12px', fontWeight: 400, color: '#8e91a0', marginLeft: '8px' }}>
                (선택사항)
              </span>
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                const selected = form.enneagram.includes(n)
                return (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      enneagram: selected
                        ? p.enneagram.filter((v) => v !== n)
                        : [...p.enneagram, n].sort((a, b) => a - b),
                    }))
                  }
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: selected ? 'none' : '1px solid #e0e2e8',
                    background: selected ? '#1c1c1e' : 'transparent',
                    color: selected ? '#ffffff' : '#555a6a',
                    fontSize: '15px',
                    fontWeight: selected ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
                )
              })}
            </div>
          </div>

          {/* 기타 특이사항 */}
          <div style={{ marginBottom: '0' }}>
            <label style={labelStyle}>
              기타 특이사항
              <span style={{ fontSize: '12px', fontWeight: 400, color: '#8e91a0', marginLeft: '8px' }}>
                (선택사항)
              </span>
            </label>
            <textarea
              value={form.special_notes}
              onChange={(e) => setForm((p) => ({ ...p, special_notes: e.target.value }))}
              placeholder="예: 봄에 쓸 향수, 데일리 사용, 달콤한 향 선호, 꽃향기 싫어함..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #c7cad5',
                borderRadius: '10px',
                background: '#fff',
                color: '#1c1c1e',
                outline: 'none',
                fontSize: '16px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
          </div>
        </motion.div>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#fff5f5',
                border: '1px solid #fed7d7',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#c53030',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 제출 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ marginTop: '20px' }}
        >
          <motion.button
            type="submit"
            disabled={!isFormValid || generating}
            whileHover={isFormValid && !generating ? { scale: 1.01 } : {}}
            whileTap={isFormValid && !generating ? { scale: 0.99 } : {}}
            style={{
              width: '100%',
              height: '52px',
              background:
                !isFormValid || generating
                  ? '#e0e2e8'
                  : 'linear-gradient(135deg, #1c1c1e 0%, #2c2c34 100%)',
              color: !isFormValid || generating ? '#a5a8b5' : '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: !isFormValid || generating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              letterSpacing: '-0.2px',
            }}
          >
            {generating ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
                AI가 레시피를 만들고 있어요...
              </>
            ) : (
              <>✦ AI 레시피 생성하기</>
            )}
          </motion.button>
          {!isFormValid && !generating && (
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#8e91a0', marginTop: '10px' }}>
              성별, 부향률, 농도(%), 용량은 필수 항목입니다
            </p>
          )}
        </motion.div>
      </form>
    </div>
  )
}
