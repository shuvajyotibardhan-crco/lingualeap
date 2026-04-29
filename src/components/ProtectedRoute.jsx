import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'
import { ProgressProvider } from '../context/ProgressContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const [resent, setResent]       = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-yellow">
        <div className="text-4xl animate-bounce">🦜</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Google OAuth users are always verified — only email/password accounts need checking.
  // Show a dismissable banner rather than a hard block so unverified users can still play.
  const showVerifyBanner = !user.emailVerified && !dismissed

  return (
    <ProgressProvider>
      {showVerifyBanner && (
        <div className="fixed top-0 inset-x-0 z-50 bg-brand-orange text-white px-4 py-3 flex items-center gap-3 shadow-md">
          <span className="text-xl">📬</span>
          <p className="flex-1 text-sm font-semibold leading-tight">
            Please verify your email ({user.email}) to secure your account.
          </p>
          <button
            onClick={async () => { await sendEmailVerification(user); setResent(true) }}
            disabled={resent}
            className="text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1 min-h-[36px] whitespace-nowrap disabled:opacity-60"
          >
            {resent ? '✅ Sent' : 'Resend'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-white/80 hover:text-white font-bold text-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </ProgressProvider>
  )
}
