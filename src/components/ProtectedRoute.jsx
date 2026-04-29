import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'
import { ProgressProvider } from '../context/ProgressContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const [resent, setResent] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-yellow">
        <div className="text-4xl animate-bounce">🦜</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Google OAuth users are always verified; only email/password accounts need checking
  if (!user.emailVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-yellow px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-7xl mb-4">📬</div>
          <h1 className="text-2xl font-display font-extrabold text-brand-orange mb-2">Verify your email</h1>
          <p className="text-gray-700 font-display mb-1">We sent a link to:</p>
          <p className="font-bold text-gray-800 font-display mb-4">{user.email}</p>
          <p className="text-sm text-gray-500 font-display mb-6">
            Click the link in that email to activate your account, then tap the button below.
          </p>
          <button
            onClick={async () => { await sendEmailVerification(user); setResent(true) }}
            disabled={resent}
            className="w-full py-3 bg-white border-2 border-brand-orange text-brand-orange font-display font-bold rounded-xl hover:bg-brand-orange/10 min-h-[44px] disabled:opacity-50 mb-3"
          >
            {resent ? '✅ Email sent!' : 'Resend verification email'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-brand-orange text-white font-display font-bold rounded-xl hover:opacity-90 min-h-[44px]"
          >
            I've verified — continue ↩
          </button>
        </div>
      </div>
    )
  }

  return <ProgressProvider>{children}</ProgressProvider>
}
