import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { updatePassword } from 'firebase/auth'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export default function ForcePasswordChange({ uid }) {
  const navigate = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [showCf, setShowCf]       = useState(false)
  const [error, setError]         = useState('')
  const [busy, setBusy]           = useState(false)
  const [done, setDone]           = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      await updatePassword(auth.currentUser, password)
      await updateDoc(doc(db, 'users', uid), { requiresPasswordChange: deleteField() })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong — please try again')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-display font-extrabold text-gray-800 mb-2">Password Updated!</h2>
          <p className="text-gray-500 font-display text-sm mb-6">Your new password has been set successfully.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-brand-orange text-white font-display font-extrabold text-lg rounded-xl hover:opacity-90 transition-all min-h-[44px]"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🔑</div>
          <h2 className="text-2xl font-display font-extrabold text-gray-800">New Password Required</h2>
          <p className="text-gray-500 font-display text-sm mt-1">
            Your password was reset. Please set a new one to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-display font-bold text-gray-700 mb-1">New password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 pr-11 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none font-display text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-display font-bold text-gray-700 mb-1">Confirm new password</label>
            <div className="relative">
              <input
                type={showCf ? 'text' : 'password'}
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-4 py-3 pr-11 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none font-display text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowCf(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showCf ? 'Hide password' : 'Show password'}
              >
                {showCf ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-red-500 text-sm font-display bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-brand-orange text-white font-display font-extrabold text-lg rounded-xl hover:opacity-90 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {busy ? 'Saving…' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
