import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

function buildNav(role) {
  const links = [{ label: 'الرئيسية', to: '/' }]

  if (role === 'applicant') {
    links.push({ label: 'طلب العضوية', to: '/application' })
    links.push({ label: 'حالة الطلب', to: '/status' })
  }

  if (role === 'volunteer') {
    links.push({ label: 'لوحة المتطوع', to: '/dashboard' })
  }

  if (['review_admin', 'admin', 'super_admin'].includes(role)) {
    links.push({ label: 'مراجعة الطلبات', to: '/admin/review' })
  }

  if (['admin', 'super_admin'].includes(role)) {
    links.push({ label: 'إعدادات التطوع', to: '/admin/settings' })
    links.push({ label: 'إدارة الصلاحيات', to: '/admin/roles' })
  }

  if (role === 'super_admin') {
    links.push({ label: 'إدارة القوائم', to: '/super/menus' })
  }

  return links
}

export default function AppShell({ title, children }) {
  const { authUser, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = buildNav(role)
  const systemTitle = 'نظام متطوعي بذور للتنمية والثقافة'

  return (
    <div className="container">
      <div className="page-shell">
        <header className="shell-header card">
          <div className="shell-header__top">
            <div className="header-brand">
              <img src="/logo-small.png" alt="شعار بذور" className="brand-logo" />
              <div>
                <p className="eyebrow">{systemTitle}</p>
                <h1>{title}</h1>
              </div>
            </div>
            <div className="header-meta">
              <p className="muted" style={{ marginTop: 6 }}>
                {authUser?.email || ''} {role ? `• ${role}` : ''}
              </p>
              <button
                className="btn secondary logout-btn"
                onClick={async () => {
                  await logout()
                  navigate('/login', { replace: true })
                }}
                type="button"
              >
                <i className="bi bi-box-arrow-right"></i>
                تسجيل الخروج
              </button>
            </div>
          </div>

          {navLinks.length ? (
            <div className="nav-links">
              {navLinks.map((link) => {
                const active = location.pathname === link.to
                return (
                  <Link key={link.to} className={`nav-chip ${active ? 'active' : ''}`} to={link.to}>
                    {link.label}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </header>

        <main className="card page-content">{children}</main>
      </div>
    </div>
  )
}
