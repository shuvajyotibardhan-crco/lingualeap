import { useState, useEffect } from 'react'
import { useCallable } from '../hooks/useCallable'

export default function ContactModal({ isOpen, onClose, prefillUsername = '', prefillEmail = '', isLoggedIn = false }) {
  const [username, setUsername] = useState(prefillUsername)
  const [email, setEmail]       = useState(prefillEmail)
  const [message, setMessage]   = useState('')
  const [sent, setSent]         = useState(false)
  const { call, loading, error } = useCallable('submitContactMessage')

  useEffect(() => {
    if (isOpen) {
      setUsername(prefillUsername)
      setEmail(prefillEmail)
      setMessage('')
      setSent(false)
    }
  }, [isOpen, prefillUsername, prefillEmail])

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await call({ username, email, message })
      setSent(true)
    } catch {
      // error shown via hook
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl shadow-2xl p-6 w-full max-w-lg mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-extrabold text-gray-800">Contact Support</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-display font-bold text-gray-700">Message sent! We'll get back to you soon.</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-3 bg-brand-orange text-white font-display font-bold rounded-xl min-h-[44px]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-display font-bold text-gray-700 mb-1">Your name</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isLoggedIn}
                className={`w-full px-4 py-3 rounded-xl border-2 font-display text-gray-800 text-base focus:outline-none focus:border-brand-orange transition-colors ${isLoggedIn ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-200'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-display font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoggedIn}
                className={`w-full px-4 py-3 rounded-xl border-2 font-display text-gray-800 text-base focus:outline-none focus:border-brand-orange transition-colors ${isLoggedIn ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-200'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-display font-bold text-gray-700 mb-1">
                Message
                <span className="text-gray-400 font-normal ml-2">{message.length}/2000</span>
              </label>
              <textarea
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="How can we help?"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 font-display text-gray-800 text-base focus:outline-none focus:border-brand-orange transition-colors resize-none"
              />
            </div>

            {error && (
              <p role="alert" className="text-red-500 text-sm font-display bg-red-50 rounded-xl px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-orange text-white font-display font-extrabold text-lg rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
