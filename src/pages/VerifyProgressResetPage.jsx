import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCallable } from '../hooks/useCallable'

const PHASE_LABEL = { 1: 'Phase 1 (Levels 1–4)', 2: 'Phase 2 (Levels 5–8)', 3: 'Phase 3 (Levels 9–12)' }

export default function VerifyProgressResetPage() {
  const [searchParams] = useSearchParams()
  const uid   = searchParams.get('uid')
  const token = searchParams.get('token')

  const [status, setStatus]   = useState('loading')
  const [phase, setPhase]     = useState(null)
  const [message, setMessage] = useState('')
  const { call } = useCallable('verifyProgressReset')

  useEffect(() => {
    if (!uid || !token) {
      setStatus('error')
      setMessage('Invalid link — missing uid or token.')
      return
    }
    call({ uid, token })
      .then(data => {
        setPhase(data.resetToPhase || null)
        setStatus('success')
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message || 'This link is invalid or has expired.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function goHome() {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-yellow px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm text-center">
        {status === 'loading' && (
          <>
            <div className="text-5xl mb-3 animate-bounce">🦜</div>
            <p className="font-display text-gray-600">Resetting your progress…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-2xl font-display font-extrabold text-gray-800 mb-2">Progress Reset!</h1>
            <p className="font-display text-gray-600 mb-1">Your progress has been reset to:</p>
            <p className="font-bold text-gray-800 font-display mb-6">{PHASE_LABEL[phase] || `Phase ${phase}`}</p>
            <button
              onClick={goHome}
              className="block w-full py-3 bg-brand-orange text-white font-display font-extrabold text-lg rounded-xl text-center hover:opacity-90 min-h-[44px]"
            >
              Go to Level Map
            </button>
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
