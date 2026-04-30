import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCallable } from '../hooks/useCallable'

export default function VerifyEmailChangePage() {
  const [searchParams] = useSearchParams()
  const uid   = searchParams.get('uid')
  const token = searchParams.get('token')

  const [status, setStatus]     = useState('loading') // loading | success | error
  const [newEmail, setNewEmail] = useState('')
  const [message, setMessage]   = useState('')
  const { call } = useCallable('verifyEmailChange')

  useEffect(() => {
    if (!uid || !token) {
      setStatus('error')
      setMessage('Invalid link — missing uid or token.')
      return
    }
    call({ uid, token })
      .then(data => {
        setNewEmail(data.newEmail || '')
        setStatus('success')
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message || 'This link is invalid or has expired.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-yellow px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm text-center">
        {status === 'loading' && (
          <>
            <div className="text-5xl mb-3 animate-bounce">🦜</div>
            <p className="font-display text-gray-600">Verifying your email change…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-2xl font-display font-extrabold text-gray-800 mb-2">Email Updated!</h1>
            <p className="font-display text-gray-600 mb-1">Your login email has been changed to:</p>
            <p className="font-bold text-gray-800 font-display mb-6">{newEmail}</p>
            <Link to="/login" className="block w-full py-3 bg-brand-orange text-white font-display font-extrabold text-lg rounded-xl text-center hover:opacity-90 min-h-[44px]">
              Sign In
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-3">❌</div>
            <h1 className="text-2xl font-display font-extrabold text-gray-800 mb-2">Link Invalid</h1>
            <p className="font-display text-gray-600 mb-6">{message}</p>
            <Link to="/" className="block w-full py-3 bg-brand-orange text-white font-display font-extrabold text-lg rounded-xl text-center hover:opacity-90 min-h-[44px]">
              Back to App
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
