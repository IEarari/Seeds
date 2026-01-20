import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell.jsx'
import { apiFetch } from '../services/api.js'

export default function AdminReviewQueue() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')

      try {
        const data = await apiFetch('/api/admin/applications?status=submitted&limit=50')
        if (!cancelled) setItems(data?.items || [])
      } catch (e) {
        if (!cancelled) {
          setItems([])
          setError(e.message || 'حدث خطأ')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppShell title="طلبات قيد المراجعة">
      <div className="card">
        {loading ? <div>جاري التحميل...</div> : null}
        {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}

        {!loading && !error && !items.length ? <div className="muted">لا يوجد طلبات حالياً</div> : null}

        {!loading && items.length ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((a) => (
              <div key={a.id} className="card">
                <div style={{ fontWeight: 700 }}>#{a.id}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  الحالة: {a.status} — الإصدار: {a.version}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Link className="btn secondary" to={`/admin/review/${a.id}`}>
                    فتح التفاصيل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
