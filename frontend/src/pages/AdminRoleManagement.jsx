import React, { useState } from 'react'
import AppShell from '../components/AppShell.jsx'
import { apiFetch } from '../services/api.js'

export default function AdminRoleManagement() {
  const [targetUserId, setTargetUserId] = useState('')
  const [newRole, setNewRole] = useState('volunteer')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <AppShell title="إدارة الصلاحيات">
      <div className="card">
        {error ? <div style={{ color: '#b91c1c', marginBottom: 10 }}>{error}</div> : null}
        {done ? <div style={{ color: '#047857', marginBottom: 10 }}>{done}</div> : null}

        <div className="field">
          <label>معرف المستخدم (UID)</label>
          <input value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} />
        </div>

        <div className="field">
          <label>الدور الجديد</label>
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            <option value="applicant">applicant</option>
            <option value="volunteer">volunteer</option>
            <option value="review_admin">review_admin</option>
            <option value="admin">admin</option>
            <option value="super_admin">super_admin</option>
          </select>
        </div>

        <div className="actions">
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              setDone('')
              try {
                await apiFetch('/api/admin/roles/assign', {
                  method: 'POST',
                  body: JSON.stringify({ targetUserId, newRole }),
                })
                setDone('تم تحديث الدور')
              } catch (e) {
                setError(e.message || 'تعذر تحديث الدور')
              } finally {
                setBusy(false)
              }
            }}
          >
            حفظ
          </button>
        </div>
      </div>
    </AppShell>
  )
}
