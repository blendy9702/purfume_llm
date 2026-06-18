'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Recipe } from '@/lib/supabase'
import RecipeListCard from '@/components/RecipeListCard'

type Props = {
  recipes: Recipe[]
}

export default function RecipesClient({ recipes: initialRecipes }: Props) {
  const router = useRouter()
  const [recipes, setRecipes] = useState(initialRecipes)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setRecipes(initialRecipes)
    setSelectedIds((prev) => {
      const next = new Set<string>()
      for (const id of prev) {
        if (initialRecipes.some((recipe) => recipe.id === id)) {
          next.add(id)
        }
      }
      return next
    })
  }, [initialRecipes])

  const allSelected = recipes.length > 0 && selectedIds.size === recipes.length

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(recipes.map((recipe) => recipe.id)))
    }
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function enterSelectionMode() {
    setSelectionMode(true)
    setSelectedIds(new Set())
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return
    if (!confirm(`선택한 ${selectedIds.size}개의 레시피를 삭제하시겠습니까?`)) return

    setError('')
    setDeleting(true)

    try {
      const res = await fetch('/api/recipes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds] }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '삭제에 실패했습니다.')
        return
      }

      setRecipes((prev) => prev.filter((recipe) => !selectedIds.has(recipe.id)))
      exitSelectionMode()
      router.refresh()
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '24px' }}
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
          생성된 레시피
        </h1>
        <p style={{ fontSize: '14px', color: '#8e91a0', margin: 0 }}>
          AI로 생성한 향수 레시피 {recipes.length}개
        </p>
      </motion.div>

      {recipes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '20px',
            padding: '12px 16px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #eef0f3',
          }}
        >
          {selectionMode ? (
            <>
              <button
                type="button"
                onClick={exitSelectionMode}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #c7cad5',
                  background: 'transparent',
                  color: '#555a6a',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #c7cad5',
                  background: 'transparent',
                  color: '#555a6a',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {allSelected ? '전체 해제' : '전체 선택'}
              </button>
              {selectedIds.size > 0 && (
                <span style={{ fontSize: '13px', color: '#8e91a0' }}>
                  {selectedIds.size}개 선택됨
                </span>
              )}
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || deleting}
                style={{
                  marginLeft: 'auto',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: selectedIds.size === 0 || deleting ? '#e0e2e8' : '#fff5f5',
                  color: selectedIds.size === 0 || deleting ? '#a5a8b5' : '#c53030',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: selectedIds.size === 0 || deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? '삭제 중...' : '선택 삭제'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={enterSelectionMode}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: '1px solid #c7cad5',
                background: 'transparent',
                color: '#555a6a',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              선택
            </button>
          )}
        </motion.div>
      )}

      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '10px',
            fontSize: '14px',
            color: '#c53030',
          }}
        >
          {error}
        </div>
      )}

      {recipes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            textAlign: 'center',
            padding: '64px 24px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #eef0f3',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌸</div>
          <p style={{ fontSize: '15px', color: '#8e91a0', margin: '0 0 16px' }}>
            아직 생성된 레시피가 없습니다
          </p>
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
              }}
            >
              ✦ 첫 레시피 만들기
            </motion.button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {recipes.map((recipe, i) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4 }}
            >
              <RecipeListCard
                recipe={recipe}
                selectionMode={selectionMode}
                selected={selectedIds.has(recipe.id)}
                onToggleSelect={toggleSelect}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
