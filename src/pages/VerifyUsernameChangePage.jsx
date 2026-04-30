import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCallable } from '../hooks/useCallable'

export default function VerifyUsernameChangePage() {
  const [searchParams] = useSearchParams()
  const uid   = searchParams.get('uid')
  const token = searchParams.get('token')

  const [newUsername, setNewUsername] = useState('')
  const [status, setStatus]           = useState('idle') // idle | loading | success | error
  const [message, setMessage]         = useState('')
  const { call } = useCallable('verifyUsernameChange')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!uid || !token) {
      setStatus('error')
      setMessage('Invalid link — missing uid or token.')
      return
    }
    setStatus('loading')
    try {
      await call({ uid, token, newUsername: newUsername.trim() })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'This link is invalid or has expired.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-yellow px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm">
        {status === 'success' ? (
          <div className="text-center">
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-2xl font-display font-extrabold text-gray-800 mb-2">Username Updated!</h1>
            <p className="font-display text-gray-600 mb-6">Your new username is: <strong>{newUsername}</strong></p>
            <Link to="/" className="block w-full py-3 bg-brand-orange text-white font-display font-extrabold text-lg rounded-xl text-center hover:opacity-90 min-h-[44px]">
              Back to App
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-display font-extrabold text-gray-800 mb-2">Choose New Username</h1>
            <p className="text-gray-500 font-display text-sm mb-6">Enter the username you'd like to use.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                maxLength={40}
                placeholder="New username (max 40 chars)"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none font-display text-gray-800"
                disabled={status === 'loading'}
              />
              {status === 'error' && (
                <p role="alert" className="text-red-500 text-sm font-display bg-red-50 rounded-xl px-4 py-2">{message}</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading' || !newUsername.trim()}
                className="w-full py-3 bg-brand-orange text-white font-display font-extrabold text-lg rounded-xl hover:opacity-90 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {status === 'loading' ? 'Saving…' : 'Save Username'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
