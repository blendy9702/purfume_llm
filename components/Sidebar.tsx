'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/', icon: '◈', label: '대시보드' },
  { href: '/recipes', icon: '✦', label: '생성된 레시피' },
  { href: '/ingredients', icon: '⬡', label: '재료 관리' },
  { href: '/recipe/new', icon: '＋', label: '레시피 생성', badge: 'AI' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0',
      }}
    >
      {/* 로고 */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid #eef0f3',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#1c1c1e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              🌸
            </div>
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1c1c1e',
                  lineHeight: 1.3,
                }}
              >
                향수 레시피
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#8e91a0',
                  fontWeight: 500,
                  letterSpacing: '0.3px',
                }}
              >
                STUDIO
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav style={{ flex: 1, padding: '12px 12px 0' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#8e91a0',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            padding: '8px 8px 4px',
            marginBottom: '4px',
          }}
        >
          메뉴
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href ||
                (item.href !== '/recipe/new' && pathname.startsWith(`${item.href}/`))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{ textDecoration: 'none', display: 'block', marginBottom: '2px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: isActive ? '#1c1c1e' : 'transparent',
                  color: isActive ? '#ffffff' : '#555a6a',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: '14px',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>{item.icon}</span>
                {item.label}
                {'badge' in item && item.badge && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      background: isActive ? 'rgba(255,255,255,0.15)' : '#ffd02f',
                      color: isActive ? '#fff' : '#1c1c1e',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* 하단 로그아웃 */}
      <div style={{ padding: '12px', borderTop: '1px solid #eef0f3' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'transparent',
            border: 'none',
            color: '#8e91a0',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fbd4d4'
            e.currentTarget.style.color = '#c53030'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#8e91a0'
          }}
        >
          <span style={{ fontSize: '16px' }}>⇥</span>
          로그아웃
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 'var(--sidebar-width)',
          height: '100vh',
          background: '#ffffff',
          borderRight: '1px solid #eef0f3',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
        }}
        className="desktop-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* 모바일 하단 바 */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          borderTop: '1px solid #eef0f3',
          zIndex: 50,
          display: 'none',
          padding: '8px 16px',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
        className="mobile-nav"
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: isActive ? '#1c1c1e' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  minWidth: '56px',
                }}
              >
                <span
                  style={{
                    fontSize: '18px',
                    color: isActive ? '#ffffff' : '#8e91a0',
                    lineHeight: 1,
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#ffffff' : '#8e91a0',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              minWidth: '56px',
            }}
          >
            <span style={{ fontSize: '18px', color: '#8e91a0', lineHeight: 1 }}>⇥</span>
            <span style={{ fontSize: '10px', color: '#8e91a0' }}>로그아웃</span>
          </button>
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-nav { display: block !important; }
        }
      `}</style>
    </>
  )
}
