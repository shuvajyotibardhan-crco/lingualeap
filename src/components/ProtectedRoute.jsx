import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ProgressProvider } from '../context/ProgressContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-yellow">
        <div className="text-4xl animate-bounce">🦜</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <ProgressProvider>{children}</ProgressProvider>
}
