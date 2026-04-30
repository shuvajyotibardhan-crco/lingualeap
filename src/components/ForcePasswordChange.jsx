import { useState } from 'react'
import { updatePassword } from 'firebase/auth'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export default function ForcePasswordChange({ uid }) {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [busy, setBusy]           = useState(false)

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
    } catch (err) {
      setError(err.message || 'Something went wrong — please try again')
    } finally {
      setBusy(false)
    }
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
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none font-display text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-display font-bold text-gray-700 mb-1">Confirm new password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none font-display text-gray-800"
            />
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
