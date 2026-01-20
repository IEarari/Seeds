import React from 'react'
import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import HomeRedirectByRole from './pages/HomeRedirectByRole.jsx'
import MembershipApplicationForm from './pages/MembershipApplicationForm.jsx'
import ApplicationStatus from './pages/ApplicationStatus.jsx'
import VolunteerDashboard from './pages/VolunteerDashboard.jsx'
import AdminReviewQueue from './pages/AdminReviewQueue.jsx'
import AdminReviewDetails from './pages/AdminReviewDetails.jsx'
import AdminSettingsVolunteering from './pages/AdminSettingsVolunteering.jsx'
import AdminRoleManagement from './pages/AdminRoleManagement.jsx'
import SuperAdminLookupsManagement from './pages/SuperAdminLookupsManagement.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRedirectByRole />
          </ProtectedRoute>
        }
      />

      <Route
        path="/application"
        element={
          <ProtectedRoute roles={['applicant']}>
            <MembershipApplicationForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/status"
        element={
          <ProtectedRoute roles={['applicant']}>
            <ApplicationStatus />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['volunteer']}>
            <VolunteerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/review"
        element={
          <ProtectedRoute roles={['review_admin', 'admin', 'super_admin']}>
            <AdminReviewQueue />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/review/:id"
        element={
          <ProtectedRoute roles={['review_admin', 'admin', 'super_admin']}>
            <AdminReviewDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={['admin', 'super_admin']}>
            <AdminSettingsVolunteering />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute roles={['admin', 'super_admin']}>
            <AdminRoleManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super/menus"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <SuperAdminLookupsManagement />
          </ProtectedRoute>
        }
      />

      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  )
}

export default App
