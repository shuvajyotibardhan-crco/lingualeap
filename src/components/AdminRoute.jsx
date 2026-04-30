import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getIdTokenResult } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin]   = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { setChecking(false); return }

    getIdTokenResult(user, true)
      .then(result => setIsAdmin(result.claims.admin === true))
      .catch(() => setIsAdmin(false))
      .finally(() => setChecking(false))
  }, [user, loading])

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-yellow">
        <div className="text-4xl animate-bounce">🦜</div>
      </div>
    )
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />

  return children
}
