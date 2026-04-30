import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LevelMap from './pages/LevelMap'
import LevelPage from './pages/LevelPage'
import AdminDashboard from './pages/AdminDashboard'
import UserSettings from './pages/UserSettings'
import VerifyEmailChangePage from './pages/VerifyEmailChangePage'
import VerifyUsernameChangePage from './pages/VerifyUsernameChangePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/verify-email-change"    element={<VerifyEmailChangePage />} />
          <Route path="/verify-username-change" element={<VerifyUsernameChangePage />} />

          <Route path="/" element={
            <ProtectedRoute><LevelMap /></ProtectedRoute>
          } />
          <Route path="/level/:levelId" element={
            <ProtectedRoute><LevelPage /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><UserSettings /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
