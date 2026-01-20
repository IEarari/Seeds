import React, { useEffect, useState } from 'react'
import AppShell from '../components/AppShell.jsx'
import { apiFetch } from '../services/api.js'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// Public settings service
async function getVolunteeringSettings() {
  try {
    const data = await apiFetch('/api/public/settings/volunteering')
    return data
  } catch (error) {
    console.error('Error fetching volunteering settings:', error)
    throw error
  }
}

export default function AdminSettingsVolunteering() {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)
  const [openFrom, setOpenFrom] = useState('')
  const [openTo, setOpenTo] = useState('')

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')

      try {
        const s = await getVolunteeringSettings()
        if (cancelled) return
        setIsApplicationOpen(Boolean(s.isApplicationOpen))
        setOpenFrom(s.openFrom || '')
        setOpenTo(s.openTo || '')
      } catch (e) {
        if (!cancelled) setError('تعذر تحميل الإعدادات')
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
    <AppShell title="إعدادات باب التطوع">
      <div className="card">
        {loading ? <div>جاري التحميل...</div> : null}
        {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}
        {done ? <div style={{ color: '#047857' }}>{done}</div> : null}

        {!loading ? (
          <>
            <div className="field">
              <label>حالة باب التطوع</label>
              <select value={isApplicationOpen ? 'open' : 'closed'} onChange={(e) => setIsApplicationOpen(e.target.value === 'open')}>
                <option value="open">مفتوح</option>
                <option value="closed">مغلق</option>
              </select>
            </div>

            <div className="row">
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>من</label>
                <DatePicker
                  selected={openFrom ? new Date(openFrom) : null}
                  onChange={(date) => setOpenFrom(date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="اختر التاريخ"
                  className="date-picker-rtl"
                  isRTL={true}
                />
              </div>
              <div style={{ flex: 1, minWidth: 240 }} className="field">
                <label>إلى</label>
                <DatePicker
                  selected={openTo ? new Date(openTo) : null}
                  onChange={(date) => setOpenTo(date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="اختر التاريخ"
                  className="date-picker-rtl"
                  isRTL={true}
                />
              </div>
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
                    await apiFetch('/api/admin/settings/volunteering', {
                      method: 'POST',
                      body: JSON.stringify({
                        isApplicationOpen,
                        openFrom: openFrom || null,
                        openTo: openTo || null,
                      }),
                    })
                    setDone('تم حفظ الإعدادات')
                  } catch (e) {
                    setError(e.message || 'تعذر حفظ الإعدادات')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                حفظ
              </button>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
