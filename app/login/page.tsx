'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id, password }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || '아이디 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fafbfc 0%, #f0f2f8 100%)',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* 로고 영역 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#1c1c1e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px',
            }}
          >
            🌸
          </motion.div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#1c1c1e',
              margin: '0 0 6px',
              letterSpacing: '-0.5px',
            }}
          >
            향수 레시피 스튜디오
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#6b6f7e',
              margin: 0,
            }}
          >
            관리자 로그인이 필요합니다
          </p>
        </div>

        {/* 로그인 카드 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid #eef0f3',
            boxShadow: 'rgba(5, 0, 56, 0.06) 0px 4px 12px 0px',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="id"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#555a6a',
                  marginBottom: '8px',
                }}
              >
                아이디
              </label>
              <input
                id="id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="아이디를 입력하세요"
                autoComplete="username"
                required
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  border: '1px solid #c7cad5',
                  borderRadius: '10px',
                  background: '#fff',
                  color: '#1c1c1e',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  fontSize: '16px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4262ff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(66,98,255,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#c7cad5'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#555a6a',
                  marginBottom: '8px',
                }}
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  border: '1px solid #c7cad5',
                  borderRadius: '10px',
                  background: '#fff',
                  color: '#1c1c1e',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  fontSize: '16px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4262ff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(66,98,255,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#c7cad5'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: '13px',
                  color: '#e53e3e',
                  margin: '-12px 0 16px',
                  padding: '10px 14px',
                  background: '#fff5f5',
                  borderRadius: '8px',
                  border: '1px solid #fed7d7',
                }}
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '44px',
                background: loading ? '#e0e2e8' : '#1c1c1e',
                color: loading ? '#a5a8b5' : '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #a5a8b5',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
