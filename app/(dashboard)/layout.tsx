import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f7f8fa',
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          marginLeft: 'var(--sidebar-width)',
        }}
        className="dashboard-main"
      >
        <div className="dashboard-content">{children}</div>
      </main>

      <style>{`
        .dashboard-content {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0 !important;
            padding-bottom: 72px;
          }
          .dashboard-content {
            padding: 24px 16px;
          }
        }
      `}</style>
    </div>
  )
}
