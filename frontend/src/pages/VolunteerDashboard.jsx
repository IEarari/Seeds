import React from 'react'
import AppShell from '../components/AppShell.jsx'

export default function VolunteerDashboard() {
  return (
    <AppShell title="لوحة المتطوع">
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>مرحبًا بك</div>
        <div className="muted">تمت الموافقة على عضويتك ويمكنك استخدام لوحة المتطوع.</div>
      </div>
    </AppShell>
  )
}
