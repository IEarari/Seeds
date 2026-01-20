import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell.jsx'
import { getApplicationById, ensureDraftApplication } from '../services/applications.js'
import { getVolunteeringSettings } from '../services/settings.js'
import { useAuth } from '../state/AuthContext.jsx'
import { formatDateYYYYMMDD } from '../utils/date.js'

export default function ApplicationStatus() {
  const { authUser, userDoc } = useAuth()
  const navigate = useNavigate()

  const [settings, setSettings] = useState(null)
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')

      try {
        const s = await getVolunteeringSettings()
        console.log('Settings loaded:', s)
        if (!cancelled) setSettings(s)

        const appId = userDoc?.currentApplicationId
        if (appId) {
          const a = await getApplicationById(appId)
          if (!cancelled) setApp(a)
        } else {
          if (!cancelled) setApp(null)
        }
      } catch (e) {
        console.error('Error loading data:', e)
        if (!cancelled) setError('تعذر تحميل البيانات')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [userDoc?.currentApplicationId])

  const status = app?.status || userDoc?.currentApplicationStatus || null

  return (
    <AppShell title="حالة الطلب">
      <div className="card">
        {loading ? <div>جاري التحميل...</div> : null}
        {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}

        {!loading && !app ? (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>لا يوجد طلب حالي</div>
            {!settings?.isApplicationOpen ? (
              <div style={{ marginTop: 8, color: '#b45309' }}>باب التطوع مغلق حالياً</div>
            ) : (
              <button className="btn" type="button" onClick={() => navigate('/application')}>
                إنشاء طلب
              </button>
            )}
          </div>
        ) : null}

        {!loading && app ? (
          <div>
            {status === 'submitted' ? (
              <>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>تم إرسال الطلب</div>
                <div className="muted">
                  بتاريخ: {formatDateYYYYMMDD(app.submittedAt) || formatDateYYYYMMDD(app.updatedAt)}
                </div>
              </>
            ) : null}

            {status === 'approved' ? (
              <>
                <div style={{ fontWeight: 700, marginBottom: 6, color: '#047857' }}>تمت الموافقة</div>
                <button className="btn" type="button" onClick={() => navigate('/dashboard')}>
                  الانتقال إلى لوحة المتطوع
                </button>
              </>
            ) : null}

            {status === 'rejected' ? (
              <>
                <div style={{ fontWeight: 700, marginBottom: 6, color: '#b91c1c' }}>تم الرفض</div>
                {app.decisionReason ? (
                  <div style={{ marginBottom: 8 }}>السبب: {app.decisionReason}</div>
                ) : null}

                {!settings?.isApplicationOpen ? (
                  <div style={{ marginTop: 8, color: '#b45309' }}>باب التطوع مغلق حالياً</div>
                ) : (
                  <button
                    className="btn"
                    type="button"
                    onClick={async () => {
                      await ensureDraftApplication({ uid: authUser.uid })
                      navigate('/application')
                    }}
                  >
                    إعادة التقديم
                  </button>
                )}
              </>
            ) : null}

            {status === 'draft' ? (
              <>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>الطلب قيد التجهيز</div>
                <button className="btn" type="button" onClick={() => navigate('/application')}>
                  متابعة تعبئة الطلب
                </button>
              </>
            ) : null}

            {!status ? <div>غير معروف</div> : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
