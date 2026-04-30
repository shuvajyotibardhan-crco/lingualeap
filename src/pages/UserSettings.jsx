import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../hooks/useProgress'
import { useCallable } from '../hooks/useCallable'

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
      <h2 className="font-extrabold text-gray-800 font-display">{title}</h2>
      {children}
    </div>
  )
}

export default function UserSettings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { progress } = useProgress()

  const [pwConfirm, setPwConfirm]   = useState(false)
  const [pwDone, setPwDone]         = useState(false)
  const [unDone, setUnDone]         = useState(false)
  const [newEmail, setNewEmail]     = useState('')
  const [emDone, setEmDone]         = useState(false)

  const { call: resetPw,     loading: pwLoading } = useCallable('adminResetPassword')
  const { call: initiateUn,  loading: unLoading } = useCallable('initiateUsernameChange')
  const { call: initiateEm,  loading: emLoading } = useCallable('initiateEmailChange')

  async function handleResetPassword() {
    try {
      await resetPw({ targetUid: user.uid })
      await signOut(auth)
      setPwDone(true)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  async function handleInitiateUsername() {
    try {
      await initiateUn({})
      setUnDone(true)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  async function handleInitiateEmail(e) {
    e.preventDefault()
    try {
      await initiateEm({ targetUid: user.uid, newEmail })
      setEmDone(true)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-brand-yellow pb-10">
      <header className="sticky top-0 z-10 bg-brand-orange shadow px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          aria-label="Back"
          className="text-white text-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-white">Account Settings</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <Panel title="Reset Password">
          {pwDone ? (
            <p className="text-green-700 font-display text-sm">✅ Check your email for your temporary password. You'll be prompted to set a new one after signing in.</p>
          ) : pwConfirm ? (
            <div className="space-y-3">
              <p className="text-gray-600 font-display text-sm">A temporary password will be emailed to <strong>{user?.email}</strong>. You'll be signed out and asked to set a new one.</p>
              <div className="flex gap-2">
                <button onClick={handleResetPassword} disabled={pwLoading} className="flex-1 py-3 bg-brand-orange text-white font-display font-bold rounded-xl disabled:opacity-50 min-h-[44px]">
                  {pwLoading ? 'Sending…' : 'Confirm Reset'}
                </button>
                <button onClick={() => setPwConfirm(false)} className="px-4 py-3 bg-gray-100 text-gray-700 font-display font-bold rounded-xl min-h-[44px]">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setPwConfirm(true)} className="w-full py-3 bg-gray-100 text-gray-700 font-display font-bold rounded-xl hover:bg-gray-200 transition-colors min-h-[44px]">
              Reset my password
            </button>
          )}
        </Panel>

        <Panel title="Change Username">
          {unDone ? (
            <p className="text-green-700 font-display text-sm">✅ Check your email — we've sent a link to choose your new username.</p>
          ) : (
            <>
              <p className="text-gray-500 font-display text-sm">Current username: <strong>{progress?.username}</strong></p>
              <button onClick={handleInitiateUsername} disabled={unLoading} className="w-full py-3 bg-gray-100 text-gray-700 font-display font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[44px]">
                {unLoading ? 'Sending…' : 'Send verification email'}
              </button>
            </>
          )}
        </Panel>

        <Panel title="Change Login Email">
          {emDone ? (
            <p className="text-green-700 font-display text-sm">✅ Check your current email — we've sent a confirmation link to approve the change.</p>
          ) : progress?.pendingEmailChange ? (
            <p className="text-brand-orange font-display text-sm">⏳ An email change is already pending. Check your inbox for the confirmation link.</p>
          ) : (
            <form onSubmit={handleInitiateEmail} className="space-y-3">
              <p className="text-gray-500 font-display text-sm">Current email: <strong>{user?.email}</strong></p>
              <input
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="New email address"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none font-display text-gray-800"
              />
              <button type="submit" disabled={emLoading || !newEmail.trim()} className="w-full py-3 bg-gray-100 text-gray-700 font-display font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[44px]">
                {emLoading ? 'Sending…' : 'Send confirmation email'}
              </button>
            </form>
          )}
        </Panel>
      </main>
    </div>
  )
}
