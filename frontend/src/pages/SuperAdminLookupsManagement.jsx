import React, { useEffect, useState } from 'react'
import AppShell from '../components/AppShell.jsx'
import { apiFetch } from '../services/api.js'

export default function SuperAdminLookupsManagement() {
  const [lookups, setLookups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')

      try {
        const data = await apiFetch('/api/super/menus')
        if (!cancelled) setLookups(data?.items || [])
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
  }, [])

  const handleAddItem = async (lookupId) => {
    if (!newItem.trim()) return
    
    try {
      await apiFetch(`/api/super/menus/${lookupId}/items`, {
        method: 'POST',
        body: JSON.stringify({ item: newItem.trim() })
      })
      
      // Refresh lookups
      const data = await apiFetch('/api/super/menus')
      setLookups(data?.items || [])
      setNewItem('')
      setEditing(null)
    } catch (e) {
      setError(e.message || 'تعذر إضافة العنصر')
    }
  }

  const handleDeleteItem = async (lookupId, item) => {
    try {
      await apiFetch(`/api/super/menus/${lookupId}/items`, {
        method: 'DELETE',
        body: JSON.stringify({ item })
      })
      
      // Refresh lookups
      const data = await apiFetch('/api/super/menus')
      setLookups(data?.items || [])
    } catch (e) {
      setError(e.message || 'تعذر حذف العنصر')
    }
  }

  return (
    <AppShell title="إدارة القوائم">
      <div className="card">
        {loading ? <div>جاري التحميل...</div> : null}
        {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}

        {!loading && !lookups.length ? <div className="muted">لا توجد قوائم</div> : null}

        {!loading && lookups.length ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {lookups.map((l) => (
              <div key={l.id} className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>{l.id}</div>
                
                <div style={{ marginBottom: 12 }}>
                  {Array.isArray(l.items) && l.items.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {l.items.map((item, idx) => (
                        <div 
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: 'var(--color-primary-soft)',
                            color: 'var(--color-primary)',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          {item}
                          <button
                            onClick={() => handleDeleteItem(l.id, item)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-primary)',
                              cursor: 'pointer',
                              padding: '2px',
                              fontSize: '12px'
                            }}
                            title="حذف"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted" style={{ fontSize: 12 }}>لا توجد عناصر</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {editing === l.id ? (
                    <>
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="أدخل عنصر جديد"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid var(--color-gray-200)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '14px'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddItem(l.id)
                          }
                        }}
                      />
                      <button
                        className="btn"
                        onClick={() => handleAddItem(l.id)}
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        إضافة
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => {
                          setEditing(null)
                          setNewItem('')
                        }}
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        إلغاء
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn secondary"
                      onClick={() => setEditing(l.id)}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      إضافة عنصر
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="muted" style={{ marginTop: 16, fontSize: 12 }}>
          يمكنك إدارة الخيارات للقوائم المنسدلة مثل المستويات التعليمية والمؤسسات والفروع.
        </div>
      </div>
    </AppShell>
  )
}
