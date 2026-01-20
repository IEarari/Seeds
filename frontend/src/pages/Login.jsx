import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-layout">
          <div className="card auth-card">
            <div className="auth-hero">
              <img src="/logo-small.png" alt="شعار بذور" className="auth-logo" />
              <h2>تسجيل الدخول</h2>
            </div>

            {error ? (
              <div className="auth-error">
                <i className="bi bi-exclamation-triangle" style={{ marginLeft: '8px' }}></i>
                {error}
              </div>
            ) : null}

            <div className="field">
              <div className="input-with-icon">
                <i className="bi bi-envelope input-icon"></i>
                <input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  type="email" 
                  placeholder="email@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="field">
              <div className="input-with-icon">
                <i className="bi bi-shield-lock input-icon"></i>
                <input 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  type="password" 
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="actions">
              <button
                className="btn auth-btn"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setError('')
                  setBusy(true)
                  try {
                    await login(email, password)
                    navigate('/', { replace: true })
                  } catch (e) {
                    setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {busy ? 'جاري الدخول...' : 'دخول'}
              </button>

              <Link className="btn secondary auth-btn-secondary" to="/register">
                إنشاء حساب جديد
              </Link>
            </div>

            <div className="auth-footer">
              بياناتك محفوظة ومستخدمة فقط لأغراض التطوع.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
