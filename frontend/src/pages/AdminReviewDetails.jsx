import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell.jsx'
import { apiFetch } from '../services/api.js'

export default function AdminReviewDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reviewNotes, setReviewNotes] = useState('')
  const [decisionReason, setDecisionReason] = useState('')
  const [busy, setBusy] = useState(false)

  const fullName = useMemo(() => {
    const p = app?.profile
    if (!p) return ''
    return `${p.firstName} ${p.fatherName} ${p.grandFatherName} ${p.lastName}`.trim()
  }, [app])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')

      try {
        const data = await apiFetch(`/api/admin/applications/${id}`)
        if (cancelled) return
        setApp(data)
        setReviewNotes(data.reviewNotes || '')
      } catch (e) {
        if (!cancelled) setError(e.message || 'حدث خطأ')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <AppShell title="تفاصيل الطلب">
      <div className="card">
        {loading ? <div>جاري التحميل...</div> : null}
        {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}

        {!loading && app ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>#{app.id}</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
              الحالة: {app.status}
            </div>

            <div style={{ marginBottom: 12 }}>{fullName}</div>

            <div className="field">
              <label>ملاحظات المراجعة</label>
              <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={4} />
            </div>

            <div className="field">
              <label>سبب الرفض (عند الرفض)</label>
              <input value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} />
            </div>

            <div className="actions">
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  setError('')
                  try {
                    await apiFetch(`/api/admin/applications/${id}/approve`, {
                      method: 'POST',
                      body: JSON.stringify({ reviewNotes: reviewNotes || null }),
                    })
                    navigate('/admin/review', { replace: true })
                  } catch (e) {
                    setError(e.message || 'تعذر اعتماد الطلب')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                اعتماد
              </button>

              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  setError('')
                  try {
                    await apiFetch(`/api/admin/applications/${id}/reject`, {
                      method: 'POST',
                      body: JSON.stringify({ decisionReason, reviewNotes: reviewNotes || null }),
                    })
                    navigate('/admin/review', { replace: true })
                  } catch (e) {
                    setError(e.message || 'تعذر رفض الطلب')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                رفض
              </button>

              <button className="btn secondary" type="button" onClick={() => navigate('/admin/review')}>
                رجوع
              </button>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
